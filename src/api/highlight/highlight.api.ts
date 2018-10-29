import {Color} from "../draw/color";
import {Observable} from "rxjs/internal/Observable";
import {DrawEvent} from "../storage/page.event";
import {DrawElement, Rectangle} from "../draw/elements";

/**
 * Describes the highlighting feature of a PDF document.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Highlighting {

    /**
     * A hot {@code Observable} which emits a {@link TextSelection}
     * when any text is selected.
     */
    readonly onTextSelection: Observable<TextSelection>;

    /**
     * A hot {@code Observable} which emits when a text selection is removed.
     */
    readonly onTextUnselection: Observable<void>;

    /**
     * True if the highlighting is enabled otherwise false.
     */
    readonly isEnabled: boolean;

    /**
     * Enables the text highlighting feature.
     */
    enable(): void;

    /**
     * Disables the text highlighting feature.
     */
    disable(): void;
}

/**
 * Describes a text selection on a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface TextSelection {

    /**
     * A hot observable which emits when a target area is highlighted.
     */
    readonly onHighlighting: Observable<DrawEvent<Rectangle>>;

    /**
     * A hot observable which emits when a target area is cleared from highlighting.
     */
    readonly onRemoveHighlighting: Observable<DrawEvent<DrawElement>>;

    /**
     * All text areas which are selected.
     */
    readonly targets: Array<Target>;

    /**
     * Highlights the selected text with the given {@code color}.
     *
     * @param {Color} color - the color used to highlight the selected text
     */
    highlight(color: Color): void;

    /**
     * Clears the highlight of the selected text.
     */
    clearHighlight(): void;
}

/**
 * Describes a highlight target area.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Target {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
