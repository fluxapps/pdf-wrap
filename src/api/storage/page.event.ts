import {Observable} from "rxjs/internal/Observable";
import { PolyLine, Rectangle, DrawElement, Ellipse, Circle, Line } from "../draw/elements";

/**
 * Possible layers of a single PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export enum PageLayer {
    HIGHLIGHT = "HIGHLIGHT",
    DRAWING = "DRAWING"
}

/**
 * Generic event fired when something is drawn on a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class DrawEvent<T> {

    constructor(
        readonly element: T,
        readonly pageNumber: number,
        readonly layer: PageLayer
    ) {}
}

/**
 * Describes a collection of draw events which are fired
 * when something on a canvas is drawn.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PageEventCollection {

    /**
     * Returns an observable of a {@link DrawEvent<PolyLine>} which
     * emits a draw event every time after a poly line is rendered.
     *
     * @returns {Observable<DrawEvent<PolyLine>>} a hot observable that emits draw events
     */
    afterPolyLineRendered(): Observable<DrawEvent<PolyLine>>;

    /**
     * Returns an observable of a {@link DrawEvent<Rectangle>} which
     * emits a draw event every time afte a highlight is rendered.
     *
     * Highlights are rectangles which are placed on a different layer then
     * the forms and paintings.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} a hot observable that emits draw events
     */
    afterHighlightRendered(): Observable<DrawEvent<Rectangle>>;

    /**
     * Returns an observable of a {@link DrawEvent<Rectangle>} which
     * emits a draw event every time after a rectangle is rendered.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} a hot observable that emits draw events
     */
    afterRectangleRendered(): Observable<DrawEvent<Rectangle>>;

    /**
     * Returns an observable of a {@link DrawEvent<Ellipse>} which
     * emits a draw event every time after an ellipse is rendered.
     *
     * @returns {Observable<DrawEvent<Ellipse>>} a hot observable that emits draw events
     */
    afterEllipseRendered(): Observable<DrawEvent<Ellipse>>;

    /**
     * Returns an observable of a {@link DrawEvent<Circle>} which
     * emits a draw event every time after a circle is rendered.
     *
     * @returns {Observable<DrawEvent<Circle>>} a hot observable that emits draw events
     */
    afterCircleRendered(): Observable<DrawEvent<Circle>>;

    /**
     * Returns an observable of a {@link DrawEvent<Line>} which
     * emits a draw event every time after a line is rendered.
     *
     * @returns {Observable<DrawEvent<Line>>} a hot observable that emits draw events
     */
    afterLineRendered(): Observable<DrawEvent<Line>>;

    /**
     * Returns an observable of {@link DrawEvent<DrawElement>} which
     * emits a draw event every time after a element is removed from a canvas.
     *
     * @returns {Observable<DrawEvent<DrawElement>>} a hot observable that emits draw events
     */
    afterElementRemoved(): Observable<DrawEvent<DrawElement>>;
}
