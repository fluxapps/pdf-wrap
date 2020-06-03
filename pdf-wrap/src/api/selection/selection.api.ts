import { Color } from "../draw";

/**
 * Describes an element selection on an arbitrary layer.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export interface ElementSelection {

    /**
     * The fill color of the current selection.
     * @since 0.5.0
     */
    fillColor: Color | null;

    /**
     * The border color of the selection.
     * @since 0.3.0
     */
    borderColor: Color;

    /**
     * The border with of the selection.
     * @since 0.3.0
     */
    borderWidth: number;

    /**
     * Moves the element one position forwards.
     * @since 0.3.0
     */
    forwards(): void;

    /**
     * Moves the element one position backwards.
     * @since 0.3.0
     */
    backwards(): void;

    /**
     * Moves the element to the back.
     * @since 0.3.0
     */
    toBack(): void;

    /**
     * Moves the element to the front.
     * @since 0.3.0
     */
    toFront(): void;

    /**
     * Removes the selected element from the current page.
     * @since 0.3.0
     */
    delete(): void;
}
