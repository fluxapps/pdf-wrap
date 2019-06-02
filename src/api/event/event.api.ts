/**
 * This event is fired when a page change was made.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
import { ElementSelection } from "../selection/selection.api";

export class PageChangeEvent {

    constructor(
        readonly pageNumber: number
    ) {
        Object.freeze(this);
        Object.seal(this);
    }
}

/**
 * This event is fired when the state of a tool is changed.
 * @see Tool
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class StateChangeEvent {

    constructor(
        readonly isActive: boolean
    ) {
        Object.freeze(this);
        Object.seal(this);
    }
}

/**
 * This event is fired if a object selection changes.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class SelectionChangeEvent {

    /**
     * Creates a new selection change event.
     *
     * @param {boolean} hasSelection - Indicates if a selection occurred or a existing selection has been disposed.
     * @param {ElementSelection | null} selection - The current selection if {@param hasSelection} is true, otherwise null.
     */
    constructor(
        readonly hasSelection: boolean,
        readonly selection: ElementSelection | null = null
    ) {
        Object.freeze(this);
        Object.seal(this);
    }
}
