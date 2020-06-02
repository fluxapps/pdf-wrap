import {Observable} from "rxjs";
import { SelectionChangeEvent, StateChangeEvent } from "../event";
import {Color} from "../draw";
import { FormsTool } from "./forms";

/**
 * Describes a collections of tools that can be used
 * to modify a PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Toolbox {
    readonly freehand: Freehand;
    readonly eraser: Eraser;
    readonly forms: FormsTool;
    readonly selection: Selection;
}

/**
 * Describes a basic tool to modifiy a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Tool {

    readonly isActive: boolean;
    readonly stateChange: Observable<StateChangeEvent>;

    toggle(): void;

    activate(): void;

    deactivate(): void;
}

/**
 * Describes a freehand drawing tool to draw on a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Freehand extends Tool {

    setColor(color: Color): Freehand;

    setStrokeWidth(px: number): Freehand;
}

/**
 * Describes a eraser tool to remove PDF annotations.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface Eraser extends Tool {}

/**
 * Describes a selection tool which is used to
 * select arbitrary elements on the PDF Document.
 */
export interface Selection extends Tool {
    readonly onElementSelection: Observable<SelectionChangeEvent>;
}
