import {Observable} from "rxjs/internal/Observable";
import {PolyLine, Rectangle, Element} from "../draw/elements";

/**
 * Possible layers of a single PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export enum PageLayer {
    HIGHLIGHT,
    DRAWING
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
     * emits a draw event every time afte a rectangle is rendered.
     *
     * @returns {Observable<DrawEvent<Rectangle>>} a hot observable that emits draw events
     */
    afterRectangleRendered(): Observable<DrawEvent<Rectangle>>;

    /**
     * Returns an observable of {@link DrawEvent<Element>} which
     * emits a draw event every time after a element is removed from a canvas.
     *
     * @returns {Observable<DrawEvent<Element>>} a hot observable that emits draw events
     */
    afterElementRemoved(): Observable<DrawEvent<Element>>;
}
