import { merge, Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { Circle, DrawElement, Ellipse, Line, PolyLine, Rectangle } from "../api/draw";
import { TextSelection } from "../api/highlight";
import { DrawEvent, PageEventCollection } from "../api/storage";
import { RescaleManager } from "./rescale-manager";

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
        private readonly _afterRectangleRendered: Observable<DrawEvent<Rectangle>>,
        private readonly _afterEllipseRendered: Observable<DrawEvent<Ellipse>>,
        private readonly _afterCircleRendered: Observable<DrawEvent<Circle>>,
        private readonly _afterLineRendered: Observable<DrawEvent<Line>>,
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
     * @returns {Observable<DrawEvent<PolyLine>>} an observable which emits draw events with a normalized poly line
     */
    afterPolyLineRendered(): Observable<DrawEvent<PolyLine>> {
        return this._afterPolyLineRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizePolyLine(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Rectangle} with the {@link RescaleManager#normalizeRectangle} method.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} an observable which emits draw events with a normalized rectangle
     */
    afterHighlightRendered(): Observable<DrawEvent<Rectangle>> {
        return this.onHighlight
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeRectangle(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Rectangle} with the {@link RescaleManager#normalizeRectangle} method.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} an observable which emits draw events with a normalized rectangle
     */
    afterRectangleRendered(): Observable<DrawEvent<Rectangle>> {
        return this._afterRectangleRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeRectangle(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Ellipse} with the {@link RescaleManager#normalizeEllipse} method.
     *
     * @returns {Observable<DrawEvent<Ellipse>>} an observable which emits draw events with a normalized ellipse
     */
    afterEllipseRendered(): Observable<DrawEvent<Ellipse>> {
        return this._afterEllipseRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeEllipse(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Circle} with the {@link RescaleManager#normalizeCircle} method.
     *
     * @returns {Observable<DrawEvent<Circle>>} an observable which emits draw events with a normalized circle
     */
    afterCircleRendered(): Observable<DrawEvent<Circle>> {
        return this._afterCircleRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeCircle(it.element), it.pageNumber, it.layer)));
    }

    /**
     * Normalized every emitted {@link Line} with the {@link RescaleManager#normalizeLine} method.
     *
     * @returns {Observable<DrawEvent<Line>>} an observable which emits draw events with a normalized line
     */
    afterLineRendered(): Observable<DrawEvent<Line>> {
        return this._afterLineRendered
            .pipe(map((it) => new DrawEvent(this.rescaleManager.normalizeLine(it.element), it.pageNumber, it.layer)));
    }
}
