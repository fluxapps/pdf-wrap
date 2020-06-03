import {Color} from "./color";
import {Dimension, Point} from "./draw.basic";

/**
 * Describes a basic element that can be drawn.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface DrawElement {
    readonly id: string;
}

/**
 * Describes an element with a border.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface BorderElement extends DrawElement {
    readonly borderColor: Color;
    readonly borderWidth: number;
    /**
     * Describes to rotation of the element.
     * @since 0.3.4
     */
    readonly rotation: number;
}

/**
 * Describes a polyline that can be drawn.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PolyLine extends BorderElement {
    readonly coordinates: Array<Point>;
}

/**
 * Describes a form shape.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Form extends BorderElement {
    readonly position: Point;
    readonly fillColor: Color;
}

/**
 * Describes a rectangle form that can be drawn.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Rectangle extends Form {
    readonly dimension: Dimension;
}

/**
 * Describes a line which can be drawn.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface Line extends BorderElement {
    readonly start: Point;
    readonly end: Point;
}

/**
 * Describes a circle which can be drawn.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface Circle extends Form {
    readonly diameter: number;
}

/**
 * Describes an ellipse which can be drawn.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface Ellipse extends Form {

    /**
     * Describes the length and height of the object.
     *
     *            |
     * ------------------------
     *            |
     */
    readonly dimension: Dimension;
}
