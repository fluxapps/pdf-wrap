/**
 * Describes a form which has no defined shape but may be created.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
import { Observable } from "rxjs";
import { Color } from "../draw/color";
import { Circle, Ellipse, Line, Rectangle } from "../draw/elements";
import { DrawEvent } from "../storage/page.event";

export interface Form<T> {

    /**
     * Emits the newly painted element.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    readonly afterPaintCompleted: Observable<DrawEvent<T>>;

    /**
     * Creates the form on the current page.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    create(): void;
}

/**
 * A form which has a configurable border but no fill-color.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface BorderForm<T> extends Form<T> {

    /**
     * Sets the border color of the form.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    borderColor: Color;

    /**
     * Sets the border with of the form.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    borderWith: number;
}

/**
 * A standard form which has configurable borders and fill-color.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface StandardForm<T> extends BorderForm<T> {

    /**
     * Sets the fill-color of the form.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    fillColor: Color;
}

/**
 * Form creation tools.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface Forms {
    readonly line: BorderForm<Line>;
    readonly rectangle: StandardForm<Rectangle>;
    readonly circle: StandardForm<Circle>;
    readonly ellipse: StandardForm<Ellipse>;
}
