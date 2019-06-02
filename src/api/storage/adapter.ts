import {URI} from "../document.service";
import { Circle, Ellipse, Line, PolyLine, Rectangle } from "../draw/elements";
import {PageEventCollection} from "./page.event";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../../log-config";


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
     * @param {URI} uri - the uri to the storage location of the page overlay
     * @param {PageEventCollection} events - page event collection to be notified on PDF page modifications
     */
    start(uri: URI, events: PageEventCollection): void;

    /**
     * Will be invoked when loading a PDF document with the matching uri of this storage adapter.
     *
     * @param {URI} uri - the uri to the storage location of the page overlay
     * @param {number} pageNumber - the number of the page that should be loaded
     *
     * @returns {Promise<PageOverlay>} the overlay data of the loaded page
     */
    loadPage(uri: URI, pageNumber: number): Promise<PageOverlay>;
}

/**
 * A skippable storage adapter provides a {@code skip} method
 * to abort a function call.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export abstract class SkippableStorgaeAdapter implements StorageAdapter {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/api/storage/adapter:SkippableStorageAdapter");

    abstract register(): URI;

    abstract loadPage(uri: URI, pageNumber: number): Promise<PageOverlay>;

    abstract start(uri: URI, events: PageEventCollection): void;

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
        this.log.info(() => `Skip storage adapter: class=${this.constructor.name}`);
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
        readonly drawings: Array<PolyLine>,
        readonly rectangles: Array<Rectangle>,
        readonly circles: Array<Circle>,
        readonly ellipses: Array<Ellipse>,
        readonly lines: Array<Line>
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

/**
 * An {@link EmptyStorageAdapter} can be used as a dummy
 * adapter which does not perform any operation or provide any data.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class EmptyStorageAdapter implements StorageAdapter {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/api/storage/adapter:EmptyStorageAdapter");

    constructor(
        private readonly uri: URI
    ) {
        this.log.info(() => "You are using an empty storage adapter. No page overlay data will be provided or stored");
    }

    async loadPage(_: URI, pageNumber: number): Promise<PageOverlay> {
        return new PageOverlay(pageNumber, [], [], [], [], [], []);
    }

    register(): URI {
        return this.uri;
    }

    start(_: URI, events: PageEventCollection): void {
        // we have to subscribe on these events otherwise, the tools will never emit anything and as a result will not draw anything
        events.afterPolyLineRendered().subscribe((__) => {/* empty implementation */});
        events.afterElementRemoved().subscribe((__) => {/* empty implementation */});
        events.afterHighlightRendered().subscribe((__) => {/* empty implementation */});
        events.afterRectangleRendered().subscribe((__) => {/* empty implementation */});
        events.afterEllipseRendered().subscribe((__) => {/* empty implementation */});
        events.afterCircleRendered().subscribe((__) => {/* empty implementation */});
        events.afterLineRendered().subscribe((__) => {/* empty implementation */});
    }
}
