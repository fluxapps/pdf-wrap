import {Highlighting, Target, TextSelection} from "../api/highlight/highlight.api";
import {Observable} from "rxjs/internal/Observable";
import {Color} from "../api/draw/color";
import {DocumentModel, getPageNumberByEvent, Page} from "./document.model";
import {Canvas} from "../paint/painters";
import {Subscriber} from "rxjs/internal-compatibility";
import {TeardownLogic} from "rxjs/internal/types";
import {filter, map, share} from "rxjs/operators";
import {DrawElement, Rectangle} from "../api/draw/elements";
import {DrawEvent, PageLayer} from "../api/storage/page.event";
import {CanvasRectangle} from "../paint/canvas.elements";
import {ClientRectangle} from "./client-rectangle";
import {Subject} from "rxjs/internal/Subject";
import {zip} from "rxjs/internal/observable/zip";

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

    private isEnabled: boolean = false;

    constructor(
        private readonly document: DocumentModel
    ) {

        const page: Observable<Page> = new Observable((subscriber: Subscriber<Event>): TeardownLogic => {
            document.viewer.addEventListener("mousedown", (evt) => subscriber.next(evt));
        })
            .pipe(map((it) => getPageNumberByEvent(it)))
            .pipe(filter((it) => it !== undefined))
            .pipe(map((it) => this.document.getPage(it!)));

        const selections: Observable<Array<Target>> = new Observable(
            (subscriber: Subscriber<Selection>): TeardownLogic => {
                            document.viewer.addEventListener("mouseup", (_) => subscriber.next(window.getSelection()));
        })
            .pipe(filter((it) => it.rangeCount !== 0))
            .pipe(map((it) =>
                cleanSelection(Array.from(it.getRangeAt(0).getClientRects()))
                    .map<Target>((selection) => {
                        return {
                            height: selection.height,
                            width: selection.width,
                            x: selection.left,
                            y: selection.top
                        };
                    })
            ))
            .pipe(filter((it) => it.length > 0));

        this.onTextSelection = zip(selections, page)
            .pipe(filter((_) => this.isEnabled))
            .pipe(map((it) => new TextSelectionImpl(it[0], it[1])))
            .pipe(share());
    }

    /**
     * Disable the text selection for a user.
     */
    disable(): void {
        this.isEnabled = false;
    }

    /**
     * Enables the text selection for a user.
     */
    enable(): void {
        this.isEnabled = true;
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

    private readonly _onHighlighting: Subject<Rectangle> = new Subject();
    private readonly _onRemoveHighlighting: Subject<DrawElement> = new Subject();

    constructor(
        readonly targets: Array<Target>,
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
     */
    clearHighlight(): void {

        this.targets
            .map(this.toRelativePosition)
            .forEach((it) => {

                const highlightManager: HighlightManager = new HighlightManager(this.page.highlightLayer, it);
                highlightManager.onRemove.subscribe(this._onRemoveHighlighting);
                highlightManager.onAdd.subscribe(this._onHighlighting);
                highlightManager.clear();

                new HighlightManager(this.page.highlightLayerTransparency, it).clear();
            });
    }

    /**
     * Highlights the {@code targets} given in the constructor
     * with the given {@code color}.
     *
     * @param {Color} color - the color to highlight the selection
     */
    highlight(color: Color): void {

        this.targets
            .map(this.toRelativePosition)
            .forEach((it) => {

                const highlightManager: HighlightManager = new HighlightManager(this.page.highlightLayer, it);
                highlightManager.onRemove.subscribe(this._onRemoveHighlighting);
                highlightManager.onAdd.subscribe(this._onHighlighting);
                highlightManager.highlight(color);

                new HighlightManager(this.page.highlightLayerTransparency, it).highlight(color);
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
                    highlight = highlight.unite(it.clientRectangle);
                    this.remove(it);
                });

            // special case: if the target is exactly next to a highlight and has the same color
            this.highlights
                .filter(this.isSameColor)
                .filter(this.isNotIntersected)
                .filter(this.isSameHighlight)
                .forEach((it) => {
                    // because no intersection, we calculate the combined rectangle ourself
                    highlight = ClientRectangle.fromCoordinates(
                        Math.min(this.target.left, it.clientRectangle.left),
                        Math.max(this.target.right, it.clientRectangle.right),
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
        return data.clientRectangle.top === this.target.top
            && data.clientRectangle.bottom === this.target.bottom;
    }

    private readonly isNotIntersected: (data: HighlightData) => boolean = (data) => !this.isIntersected(data);

    private readonly clearHighlight: (data: HighlightData) => void = (data) => {

        this.remove(data);

        data.clientRectangle.subtract(this.target)
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
}

/**
 * Compares any rect in the given {@code rects} with each other.
 * If any rect does overlap another rect by more than 85%, it will be
 * excluded in the returned array.
 *
 * The current rect to compare must be smaller than the one it gets compared to,
 * in order to calculate the intersection. As a result, only smaller rects will
 * be removed in case of an overlap.
 *
 * @param {Array<ClientRect>} rects - the rects to compare
 *
 * @returns {Array<ClientRect>} the cleaned rect array
 *
 * @since 0.0.1
 * @internal
 */
export function cleanSelection(rects: Array<ClientRect>): Array<ClientRect> {

    const outArray: Array<ClientRect> = [];

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
                outArray.push(it);
            }
        });

    return outArray;
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
