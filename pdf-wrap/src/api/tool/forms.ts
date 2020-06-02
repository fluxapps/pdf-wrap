/**
 * Describes a form which has no defined shape but may be created.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
import { Observable } from "rxjs";
import { Circle, Color, Ellipse, Line, Rectangle } from "../draw";
import { DrawEvent } from "../storage";
import { EllipseToolConfig, FormToolConfig } from "./configuration";

export interface FormTool<T, C extends FormToolConfig> {

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
    create(config?: Partial<C>): void;
}

/**
 * A form which has a configurable border but no fill-color.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface BorderFormTool<T, C = FormToolConfig> extends FormTool<T, C> {

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
export interface StandardFormTool<T, C = FormToolConfig> extends BorderFormTool<T, C> {

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
export interface FormsTool {
    readonly line: BorderFormTool<Line>;
    readonly rectangle: StandardFormTool<Rectangle>;
    readonly circle: StandardFormTool<Circle>;
    readonly ellipse: StandardFormTool<Ellipse, EllipseToolConfig>;
}
