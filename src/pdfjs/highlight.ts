import {Highlighting, Target, TextSelection} from "../api/highlight/highlight.api";
import {Observable} from "rxjs/internal/Observable";
import {Color} from "../api/draw/color";
import {DocumentModel, getPageNumberByEvent, Page} from "./document.model";
import {Canvas} from "../paint/painters";
import {filter, map, share, tap, withLatestFrom} from "rxjs/operators";
import {DrawElement, Rectangle} from "../api/draw/elements";
import {DrawEvent, PageLayer} from "../api/storage/page.event";
import {CanvasRectangle} from "../paint/canvas.elements";
import {ClientRectangle} from "./client-rectangle";
import {Subject} from "rxjs/internal/Subject";
import {fromEvent} from "rxjs/internal/observable/fromEvent";
import {merge} from "rxjs/internal/observable/merge";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";

/**
 * Represents the text highlighting feature of a PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class TextHighlighting implements Highlighting {

    /**
     * Emits a {@link TextSelection} when a user selects text on a PDF page.
     */
    readonly onTextSelection: Observable<TextSelection>;

    /**
     * @deprecated Will be removed in the future
     */
    readonly onTextUnselection: Observable<void>;

    private enabled: boolean = false;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/highlight:TextHighlighting");

    get isEnabled(): boolean {
        return this.enabled;
    }

    constructor(
        private readonly document: DocumentModel
    ) {

        // get the page where the mouse down event was
        const page: Observable<Page> = merge(
            fromEvent(document.viewer, "mousedown"),
            fromEvent<TouchEvent>(document.viewer, "touchstart")
        )
            .pipe(tap((_) => this.log.debug(() => "get page number by event")))
            .pipe(map((it) => getPageNumberByEvent(it)))
            .pipe(filter((it) => it !== undefined && this.document.hasPage(it)))
            .pipe(map((it) => this.document.getPage(it!)))
            .pipe(tap((it) => this.log.debug(() => `found page number by event: ${it.pageNumber}`)));

        // transformed selection on mouse up only inside the viewer
        const selections: Observable<Array<Target>> = merge(
            // fromEvent(document.viewer, "mouseup"),
            // fromEvent(document.viewer, "touchend")
            fromEvent(window.document, "selectionchange")
        )
            .pipe(map((_) => window.getSelection()))
            .pipe(map(transformSelection))
            .pipe(filter((it) => it.length > 0))
            .pipe(tap((it) => this.log.debug(() => `targets: ${JSON.stringify(it)}`)));

        // page and selections observable zipped determines a valid text selection
        this.onTextSelection = selections
            .pipe(withLatestFrom(page))
            .pipe(tap((it) => this.log.debug(() => `Page for selection: page=${it[1].pageNumber}`)))
            .pipe(filter((_) => this.enabled))
            .pipe(map((it) => new TextSelectionImpl(it[1])))
            .pipe(share());


        // the actions when noting is selected
        // const onHighlight: Observable<void> = this.onTextSelection
        //     .pipe(mergeMap((it: TextSelection) => it.onHighlighting))
        //     .pipe(map((_) => {/* return void */}));
        //
        // const onRemoveHighlight: Observable<void> = this.onTextSelection
        //     .pipe(mergeMap((it: TextSelection) => it.onRemoveHighlighting))
        //     .pipe(map((_) => {/* return void */}));

        const onMouseUpUnselection: Observable<void> = merge(
            fromEvent(document.viewer, "mouseup"),
            fromEvent<TouchEvent>(document.viewer, "touchend")
        )
            .pipe(map((_) => window.getSelection().rangeCount))
            // .pipe(map(transformSelection))
            .pipe(filter((it) => it < 1))
            .pipe(map((_) => {/* return void */}));

        // if one of them emits, nothing is selected
        this.onTextUnselection = merge(onMouseUpUnselection);
    }

    /**
     * Disable the text selection for a user.
     */
    disable(): void {
        this.log.info(() => "Disable text highlighting");
        this.enabled = false;
    }

    /**
     * Enables the text selection for a user.
     */
    enable(): void {
        this.log.info(() => "Enable text highlighting");
        this.enabled = true;
    }
}

/**
 * Represents a tex selection a single page.
 * All operations will be performed on both, the {@link Page#highlight} and the {@link Page#highlightLayerTransparency},
 * but only the events on the first layer will be emitted.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class TextSelectionImpl implements TextSelection {

    readonly onHighlighting: Observable<DrawEvent<Rectangle>>;
    readonly onRemoveHighlighting: Observable<DrawEvent<DrawElement>>;

    get targets(): Array<Target> {
        return transformSelection(window.getSelection());
    }

    private readonly _onHighlighting: Subject<Rectangle> = new Subject();
    private readonly _onRemoveHighlighting: Subject<DrawElement> = new Subject();

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/highlight:TextSelectionImpl");

    constructor(
        private readonly page: Page
    ) {
        this.onHighlighting = this._onHighlighting.asObservable()
            .pipe(map((it) => new DrawEvent(it, this.page.pageNumber, PageLayer.HIGHLIGHT)))
            .pipe(share());

        this.onRemoveHighlighting = this._onRemoveHighlighting.asObservable()
            .pipe(map((it) => new DrawEvent(it, this.page.pageNumber, PageLayer.HIGHLIGHT)))
            .pipe(share());
    }

    /**
     * Clears the highlight on the {@code targets} given in the constructor.
     * Any text selection will be removed by this method.
     */
    clearHighlight(): void {

        this.log.trace(() => "Clear highlight by text selection");
        this.log.debug(() => `Text selection: targets=${JSON.stringify(this.targets)}`);

        this.targets
            .map(this.toRelativePosition)
            .forEach((it) => {

                const highlightManager: HighlightManager = new HighlightManager(this.page.highlightLayerTransparency, it);
                highlightManager.onRemove.subscribe(this._onRemoveHighlighting);
                highlightManager.onAdd.subscribe(this._onHighlighting);
                highlightManager.clear();

                // new HighlightManager(this.page.highlightLayerTransparency, it).clear();
            });
    }

    /**
     * Highlights the {@code targets} given in the constructor
     * with the given {@code color}.
     *
     * Any text selection will be removed by this method.
     *
     * @param {Color} color - the color to highlight the selection
     */
    highlight(color: Color): void {

        this.log.trace(() => `Highlight text selection: color=${color.hex("#XXXXXX")}`);
        this.log.debug(() => `Text selection: targets=${JSON.stringify(this.targets)}`);

        this.targets
            .map(this.toRelativePosition)
            .forEach((it) => {

                const highlightManager: HighlightManager = new HighlightManager(this.page.highlightLayerTransparency, it);
                highlightManager.onRemove.subscribe(this._onRemoveHighlighting);
                highlightManager.onAdd.subscribe(this._onHighlighting);
                highlightManager.highlight(color);

                // new HighlightManager(this.page.highlightLayerTransparency, it).highlight(color);
            });
    }

    /**
     * Calculates the relative position of the given {@code target} to
     * the {@link Page#pagePosition}.
     *
     * @param {Target} target - the target to calculate
     *
     * @returns {Target} the relative positioned target
     */
    private readonly toRelativePosition: (target: Target) => Target = (target) => {
        return {
            height: target.height,
            width: target.width,
            x: target.x - this.page.pagePosition.x,
            y: target.y - this.page.pagePosition.y
        };
    }
}

/**
 * Manages highlight by checking several cases how a highlight can be added or cleared.
 * Its main purpose is to avoid overlapping highlights.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class HighlightManager {

    /**
     * A hot observable which emits {@link DrawElement} when any highlight is removed.
     */
    readonly onRemove: Observable<DrawElement>;

    /**
     * A hot observable which emits {@link Rectangle} when any highlight is added.
     */
    readonly onAdd: Observable<Rectangle>;

    private readonly _onRemove: Subject<DrawElement> = new Subject();
    private readonly _onAdd: Subject<Rectangle> = new Subject();

    private readonly target: ClientRectangle;
    private readonly highlights: Array<HighlightData>;

    private highlightColor?: Color;

    /**
     * @returns {boolean} true if the target is not completely covered by a existing highlight, otherwise false
     */
    private get targetIsNotCovered(): boolean {
        return !this.highlights
            .some((it) => {
                return it.clientRectangle.intersectionAreaOf(this.target) === this.target.area()
                && it.rectangle.fillColor.hex() === this.highlightColor!.hex();
            });
    }

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/highlight:HighlightManager");

    constructor(
        private readonly canvas: Canvas,
        target: Target
    ) {
        this.onRemove = this._onRemove.asObservable().pipe(share());
        this.onAdd = this._onAdd.asObservable().pipe(share());

        this.target = ClientRectangle.fromSize(
            target.y,
            target.x,
            target.height,
            target.width
        );

        this.highlights = this.canvas.select(".drawing")
            .map((it) => new HighlightData(it as CanvasRectangle));
    }

    /**
     * Clears any highlight at the given constructor parameter {@code target}.
     */
    clear(): void {
        this.highlights
            .filter(this.isIntersected)
            .forEach(this.clearHighlight);
    }

    /**
     * Highlights the given constructor parameter {@code target} with the given {@code color}.
     *
     * The following cases are considered:
     *
     * case: The target overlaps no highlight at all and sits not right next to any highlight.
     * result: The target will be added as a new highlight
     *
     * case: The target overlaps an existing highlight and will be highlighted with the same color.
     * result: The existing highlight will be removed and a new highlight covering the old highlight
     *          and the target will be added.
     *
     * case: The target overlaps an existing highlight and will be highlighted with a different color.
     * result: The existing highlight will be removed and replaced with an adjusted highlight which has the target subtracted.
     *          The target will be added as a new highlight.
     *
     * case: The target sits right next to an existing highlight and will be highlighted with the same color.
     * result: The existing highlight will be removed and a new highlight covering the old highlight
     *          and the target will be added.
     *
     * case: The target is completely covered by an existing highlight and will be highlighted with the same color.
     * result: No operation will be performed at all, because nothing needs to be done.
     *
     * @param {Color} color - the color to highlight the target
     */
    highlight(color: Color): void {

        this.highlightColor = color;

        if (this.targetIsNotCovered) {

            let highlight: ClientRectangle = this.target;

            // clear all highlights which are being reduced by the selection
            this.highlights
                .filter(this.isNotSameColor)
                .filter(this.isIntersected)
                .forEach(this.clearHighlight);

            // unite all highlights with the target, which have the same color
            this.highlights
                .filter(this.isSameColor)
                .filter(this.isIntersected)
                .forEach((it) => {
                    highlight = highlight.unite(this.adjustHeight(it.clientRectangle));
                    this.remove(it);
                });

            // special case: if the target is exactly next to a highlight and has the same color
            this.highlights
                .filter(this.isSameColor)
                .filter(this.isNotIntersected)
                .filter(this.isSameHighlight)
                .forEach((it) => {
                    // because no intersection, we calculate the combined rectangle our-self
                    highlight = ClientRectangle.fromCoordinates(
                        Math.min(highlight.left, it.clientRectangle.left),
                        Math.max(highlight.right, it.clientRectangle.right),
                        this.target.top,
                        this.target.bottom
                    );
                    this.remove(it);
                });

            this.paintHighlight(highlight);
        }
    }

    private remove(data: HighlightData): void {
        data.canvasRectangle.remove();
        this._onRemove.next(data.rectangle);
    }

    private paintHighlight(rect: ClientRectangle): void {

        this.log.debug(() => `Paint highlight: position={x: ${rect.left}, y: ${rect.top}, width: ${rect.width}, height: ${rect.height}}`);

        const newHighlight: CanvasRectangle = this.canvas.rectangle()
            .fillColor(this.highlightColor!)
            .dimension({height: rect.height, width: rect.width})
            .position({x: rect.left, y: rect.top})
            .paint();

        this._onAdd.next(newHighlight.transform());
    }

    // define operators used for collections
    private readonly isIntersected: (data: HighlightData) => boolean = (data) => {
        return this.isAtSameHeight(data)
            && data.clientRectangle.isIntersectedWith(this.target);
    }

    private readonly isAtSameHeight: (data: HighlightData) => boolean = (data) => {
        const slightlySmaller: boolean = data.clientRectangle.height > this.target.height * 0.98;
        const slightlyBigger: boolean = data.clientRectangle.height <= this.target.height * 1.02;

        return slightlySmaller && slightlyBigger;
    }

    private readonly isNotIntersected: (data: HighlightData) => boolean = (data) => !this.isIntersected(data);

    private readonly clearHighlight: (data: HighlightData) => void = (data) => {

        this.log.trace(() => "Clear highlight");
        this.log.debug(() => `Highlight: clientRectangle=${data.clientRectangle.toString()}`);

        this.remove(data);

        this.adjustHeight(data.clientRectangle).subtract(this.target)
            .forEach((result) => {

                const newRect: CanvasRectangle = this.canvas.rectangle()
                    .borderColor(data.rectangle.borderColor)
                    .fillColor(data.rectangle.fillColor)
                    .position({x: result.left, y: result.top})
                    .dimension({height: result.height, width: result.width})
                    .paint();

                this._onAdd.next(newRect.transform());
            });
    }

    private readonly isSameHighlight: (data: HighlightData) => boolean = (data) => {
        return this.isAtSameHeight(data)
            && (data.clientRectangle.left === this.target.right || data.clientRectangle.right === this.target.left);
    }

    private readonly isSameColor: (data: HighlightData) => boolean = (data) => {
        return data.rectangle.fillColor.hex() === this.highlightColor!.hex();
    }

    private readonly isNotSameColor: (data: HighlightData) => boolean = (data) => {
        return !this.isSameColor(data);
    }

    private adjustHeight(clientRect: ClientRectangle): ClientRectangle {
        return ClientRectangle.fromCoordinates(
            clientRect.left,
            clientRect.right,
            this.target.top,
            this.target.bottom
        );
    }
}

/**
 * Compares any rect from the given {@code selection} with each other.
 * If any rect does overlap another rect by more than 85%, it will be
 * excluded in the returned array.
 *
 * The current rect to compare must be smaller than the one it gets compared to,
 * in order to calculate the intersection. As a result, only smaller rects will
 * be removed in case of an overlap.
 *
 * @param {Selection} selection - the selection to transform
 *
 * @returns {Array<Target>} the cleaned selections
 *
 * @since 0.0.1
 * @internal
 */
export function transformSelection(selection: Selection): Array<Target> {

    const outArray: Array<Target> = [];

    if (selection.rangeCount !== 0 && selection.type === "Range") {

        const rects: Array<ClientRect> = Array.from(getNodeSizedClientRects(selection.getRangeAt(0)));

        rects
            .map((it) => ClientRectangle.from(it))
            .filter(tooSmallRectangle)
            .forEach((it, index) => {

                const others: Array<ClientRect> = rects.filter(notIndex.bind(index)); // remove the current rect

                const exclude: boolean = others
                    .map((other) => ClientRectangle.from(other))
                    .filter((other) => it.area() < other.area()) // we only want exclude smaller rects
                    .map((other) => it.percentageIntersectionOf(other))
                    .filter((overlap) => overlap > 0.85).length > 0;

                if (!exclude) {
                    outArray.push({
                        height: it.height,
                        width: it.width,
                        x: it.left,
                        y: it.top
                    });
                }
            });
    }

    return outArray;
}

/**
 * Text node filter implementation.
 *
 * Filters nodes of the type text which contains only whitespaces taps and newlines.
 */
class BlankTextNodeFilter implements NodeFilter {
    private static readonly FILTER_REGEX: RegExp = /^\s*$/g;
    private static readonly NODE_TYPE_TEXT: number = 3;

    acceptNode(it: Node): number {
        if (it.nodeType !== BlankTextNodeFilter.NODE_TYPE_TEXT) {
            return NodeFilter.FILTER_REJECT;
        }
        return !BlankTextNodeFilter.FILTER_REGEX.test(it.textContent ? it.textContent : "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
}

/**
 * Calculates the size of the client rects of the direct parents of the text nodes
 * in order to fix the odd selection size given by Range::getClientRects(); in webkit browsers like safari or chrome.
 *
 * Text nodes which only contains spaces taps and newlines are ignored.
 *
 * @param {Range} range The range which should be used to calculate the client rects.
 *
 * @return {Array<DOMRect>} The rectangels of the selected text.
 */
function getNodeSizedClientRects(range: Range): Array<DOMRect> {

    const log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/highlight:getNodeSizedClientRects");

    // tslint:disable-next-line:strict-type-predicates
    if (typeof document === "undefined") {
        return Array.from(range.getClientRects() as DOMRectList);
    }

    log.trace("Recalculate size of the selected nodes.");

    const nodes: NodeIterator = document!.createNodeIterator(
        range.commonAncestorContainer,
        NodeFilter.SHOW_TEXT,
        new BlankTextNodeFilter()
    );

    const selectionNodes: Array<DOMRect> = [];
    while (nodes.nextNode()) {
        const node: Node = nodes.referenceNode;

        // skip elements until selection begins
        if (selectionNodes.length === 0 && !node.isSameNode(range.startContainer)) {
            continue;
        }

        // Check if we only have one line selected and calculate the offset of the selection.
        if (range.startContainer.isSameNode(range.endContainer)) {
            const startRange: Range = new Range();
            startRange.setStart(node, range.startOffset);
            startRange.setEnd(node, range.endOffset);
            const tempRect: DOMRect = startRange.getBoundingClientRect() as DOMRect;
            const rect: DOMRect = node.parentElement!.getBoundingClientRect() as DOMRect;
            selectionNodes.push(new DOMRect(tempRect.left, rect.top, tempRect.width, rect.height));
            break;
        }

        // check if we hit the start of the selection and calculate the start text offset.
        if (node.isSameNode(range.startContainer)) {
            const startRange: Range = new Range();
            startRange.setStart(node, range.startOffset);
            startRange.setEndAfter(node);
            const tempRect: DOMRect = startRange.getBoundingClientRect() as DOMRect;
            const rect: DOMRect = node.parentElement!.getBoundingClientRect() as DOMRect;
            selectionNodes.push(new DOMRect(tempRect.left, rect.top, tempRect.width, rect.height));
            continue;
        }

        // check if we hit the end of the selection and calculate the end text offset.
        if (node.isSameNode(range.endContainer)) {
            const startRange: Range = new Range();
            startRange.setStartBefore(node);
            startRange.setEnd(node, range.endOffset);
            const tempRect: DOMRect = startRange.getBoundingClientRect() as DOMRect;
            const rect: DOMRect = node.parentElement!.getBoundingClientRect() as DOMRect;
            selectionNodes.push(new DOMRect(rect.left, rect.top, tempRect.width , rect.height));
            break;
        }

        // we are in the middle of the selection at this point just add it.
        selectionNodes.push(node.parentElement!.getBoundingClientRect() as DOMRect);
    }

    return selectionNodes;
}

function tooSmallRectangle(rect: ClientRectangle): boolean {
    return !(rect.width < 1 || rect.height < 1);
}

function notIndex(this: number, _: ClientRect, index: number): boolean {
    return index !== this;
}

/**
 * Represents the 3 possible types of a {@link CanvasRectangle}
 * used in the {@link HighlightManager}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
class HighlightData {

    readonly rectangle: Rectangle;
    readonly clientRectangle: ClientRectangle;

    constructor(
        readonly canvasRectangle: CanvasRectangle
    ) {
        this.rectangle = canvasRectangle.transform();
        this.clientRectangle = ClientRectangle.fromSize(
            this.rectangle.position.y,
            this.rectangle.position.x,
            this.rectangle.dimension.height,
            this.rectangle.dimension.width
        );
    }
}
