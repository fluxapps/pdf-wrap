import {DrawEvent, PageEventCollection} from "../api/storage/page.event";
import {DrawElement, PolyLine, Rectangle} from "../api/draw/elements";
import {Observable} from "rxjs/internal/Observable";
import {TextSelection} from "../api/highlight/highlight.api";
import {map, mergeMap} from "rxjs/operators";
import {merge} from "rxjs/internal/observable/merge";
import {RescaleManager} from "./rescale-manager";

/**
 * Implementation of {@link PageEventCollection} which considers the
 * scale of the PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsPageEvenCollection implements PageEventCollection {

    private readonly onHighlightRemove: Observable<DrawEvent<DrawElement>>;

    /**
     * Normalized every emitted {@link Rectangle} with the {@link RescaleManager#normalizeRectangle} method.
     */
    private readonly onHighlight: Observable<DrawEvent<Rectangle>>;

    constructor(
        private readonly _afterPolyLineRendered: Observable<DrawEvent<PolyLine>>,
        private readonly _afterElementRemoved: Observable<DrawEvent<DrawElement>>,
        onTextSelection: Observable<TextSelection>,
        private readonly rescaleManager: RescaleManager
    ) {
        this.onHighlightRemove = onTextSelection
            .pipe(mergeMap((it) => it.onRemoveHighlighting));

        this.onHighlight = onTextSelection
            .pipe(mergeMap((selection) => selection.onHighlighting));
    }

    afterElementRemoved(): Observable<DrawEvent<DrawElement>> {
        return merge(this._afterElementRemoved, this.onHighlightRemove);
    }

    /**
     * Normalizes every emitted {@link PolyLine} with the {@link RescaleManager#normalizePolyLine} method.
     *
     * @returns {Observable<DrawEvent<PolyLine>>} a observable which emits draw events with a normalized poly line
     */
    afterPolyLineRendered(): Observable<DrawEvent<PolyLine>> {
        return this._afterPolyLineRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizePolyLine(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Rectangle} with the {@link RescaleManager#normalizeRectangle} method.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} a observable which emits draw events with a normalized rectangle
     */
    afterRectangleRendered(): Observable<DrawEvent<Rectangle>> {
        return this.onHighlight
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeRectangle(it.element), it.pageNumber, it.layer)));
    }
}
