/**
 * Describes a point on a coordinate system.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Point {
    readonly x: number;
    readonly y: number;
}

/**
 * Describes a size of a 2 dimensional shape.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Dimension {
    readonly width: number;
    readonly height: number;
}
