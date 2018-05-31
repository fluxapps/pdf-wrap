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
