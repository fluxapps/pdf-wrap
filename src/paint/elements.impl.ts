import {Canvas} from "./painters";
import {PolyLine, Rectangle} from "../api/draw/elements";
import {Dimension, Point} from "../api/draw/draw.basic";
import {Color} from "../api/draw/color";

/**
 * Describes a element which can draw itself on a canvas.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface DrawableElement {

    /**
     * Draws itself on the given {@code canvas}.
     *
     * @param {Canvas} canvas - the canvas to draw on
     */
    draw(canvas: Canvas): void;
}

/**
 * Drawable {@link PolyLine} implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class DrawablePolyLine implements PolyLine, DrawableElement {

    constructor(
        readonly borderColor: Color,
        readonly borderWidth: number,
        readonly coordinates: Array<Point>,
        readonly id: string
    ) {}

    draw(canvas: Canvas): void {

        canvas.polyLine()
            .id(this.id)
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .coordinates(this.coordinates)
            .paint();
    }
}

/**
 * Drawable {@link Rectangle} implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class DrawableRectangle implements Rectangle, DrawableElement {

    constructor(
        readonly borderColor: Color,
        readonly borderWidth: number,
        readonly dimension: Dimension,
        readonly fillColor: Color,
        readonly id: string,
        readonly position: Point
    ) {}

    draw(canvas: Canvas): void {

        canvas.rectangle()
            .id(this.id)
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .fillColor(this.fillColor)
            .position(this.position)
            .dimension(this.dimension)
            .paint();
    }
}
