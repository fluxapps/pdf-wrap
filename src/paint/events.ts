import { DragHandler } from "svg.draggable.js";
import svgjs from "svg.js";

export interface CanvasElementEventData {
    event: Event;
}

export interface DragEventData extends CanvasElementEventData {

}

export interface BoxDragData extends DragEventData {
    handler: DragHandler;
    box: svgjs.Box;
}

export interface BBoxDragData extends BoxDragData {
    box: svgjs.BBox;
}

export interface CanvasElementResizeEventData extends CanvasElementEventData {
    dx: number;
    dy: number;
}

/**
 * All custom svgjs events which are already namespaced
 * for the pdf-wrap library.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 *
 * @Internal
 */
export const enum PaintEvent {
    DRAG_BEFORE = "beforedrag.pdf-wrap",
    DRAG_START = "dragstart.pdf-wrap",
    DRAG_MOVE = "dragmove.pdf-wrap",
    DRAG_END = "dragend.pdf-wrap",
    RESIZE_START = "resizestart.pdf-wrap",
    RESIZE_MOVE = "resizing.pdf-wrap",
    RESIZE_END = "resizedone.pdf-wrap"
}

/**
 * Describes the SVG js drag events.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class ElementDragEventMap {

    /**
     * Cancelable
     */
    [PaintEvent.DRAG_BEFORE]: CustomEvent<Readonly<DragEventData>>;
    [PaintEvent.DRAG_START]: CustomEvent<Readonly<BBoxDragData>>;
    /**
     * Cancelable
     */
    [PaintEvent.DRAG_MOVE]: CustomEvent<Readonly<BoxDragData>>;
    [PaintEvent.DRAG_END]: CustomEvent<Readonly<BoxDragData>>;
}

/**
 * Describes the SVG js resize events.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class ElementResizeEventMap {
    [PaintEvent.RESIZE_START]: CustomEvent<Readonly<CanvasElementResizeEventData>>;
    [PaintEvent.RESIZE_MOVE]: CustomEvent<Readonly<CanvasElementResizeEventData>>;
    [PaintEvent.RESIZE_END]: CustomEvent<null>;
}
