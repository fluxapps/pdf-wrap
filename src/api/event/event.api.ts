/**
 * This event is fired when a page change was made.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PageChangeEvent {

    constructor(
        readonly pageNumber: number
    ) {}
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
    ) {}
}
