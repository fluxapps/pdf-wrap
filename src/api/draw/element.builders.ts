import {Color} from "./color";
import {PolyLine, Rectangle} from "./elements";
import {Dimension, Point} from "./draw.basic";

/**
 * Describes a factory to create specific element builders.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface ElementBuilderFactory {
    rectangle(): RectangleBuilder;
    polyLine(): PolyLineBuilder;
}

/**
 * Describes a builder for a generic {@link BorderElement}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 *
 * @param <T> a specific element builder that will be returned for method chaining
 * @param <R> the element type that will be returned by the {@code build} method
 */
export interface BorderElementBuilder<T, R> {
    id(value: string): T;
    borderColor(value: Color): T;
    build(): R;
}

/**
 * Describes a builder for a {@link PolyLine} element.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PolyLineBuilder extends BorderElementBuilder<PolyLineBuilder, PolyLine> {
    coordinates(value: Array<Point>): PolyLineBuilder;
}

/**
 * Describes a builder for a generic {@link Form} element.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 *
 * @param <T> a specific form builder that will be returned for method chaining
 * @param <R> the element type that will be returned by the {@code build} method
 */
export interface FormBuilder<T, R> extends BorderElementBuilder<T, R> {
    position(value: Point): T;
    fillColor(value: Color): T;
}

/**
 * Describe a builder for a {@link Rectangle} element.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface RectangleBuilder extends FormBuilder<RectangleBuilder, Rectangle> {
    dimension(value: Dimension): RectangleBuilder;
}
