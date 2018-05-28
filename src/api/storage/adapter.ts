import {URI} from "../document.service";
import {BorderElement, Rectangle} from "../draw/elements";
import {PageEventCollection} from "./page.event";

/**
 * Describes a adapdet to load page overlays
 * or get notified when a PDF page is modified.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface StorageAdapter {

    /**
     * Will be invoked to register this storage adapter.
     *
     * The schema of the returned {@link URI} will be used
     * to identify this adapter.
     *
     * @returns {URI} the uri to identify this adapter
     */
    register(): URI;

    /**
     * Will be invoked when the storage adapter is used the first time.
     *
     * @param {PageEventCollection} events - page event collection to be notified on PDF page modifications
     */
    start(events: PageEventCollection): void;

    /**
     * Will be invoked when loading a PDF document with the matching uri of this storage adapter.
     *
     * @param {number} pageNumber - the number of the page that should be loaded
     *
     * @returns {Promise<PageOverlay>} the overlay data of the loaded page
     */
    loadPage(pageNumber: number): Promise<PageOverlay>;
}

/**
 * A skippable storage adapter provides a {@code skip} method
 * to abort a function call.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export abstract class SkippableStorgaeAdapter implements StorageAdapter {

    abstract register(): URI;
    abstract start(): void;
    abstract loadPage(pageNumber: number): Promise<PageOverlay>;

    /**
     * Emits a skip signal to indicate that the invoked
     * function should not be finished.
     * To archive this, an {@link UnfinishedExecutionError} will be thrown.
     *
     * This method MUST only be called inside the {@link StorageAdapter#loadPage} method.
     *
     * @throws {UnfinishedExecutionError} to indicate the skip of a function
     */
    protected skip(): void {
        throw new UnfinishedExecutionError("Skip function execution");
    }
}

/**
 * Contains data about a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PageOverlay {

    constructor(
        readonly pageNumber: number,
        readonly highlightings: Array<Rectangle>,
        readonly drawings: Array<BorderElement>
    ) {}
}

/**
 * Indicates that a invoked function is not finsihed executed,
 * but aborted somewhere during the execution.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class UnfinishedExecutionError extends Error {}
