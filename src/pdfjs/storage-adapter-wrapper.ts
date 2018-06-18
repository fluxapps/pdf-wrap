import {PageOverlay, StorageAdapter} from "../api/storage/adapter";
import {StorageRegistry} from "../api/storage/adapter.registry";
import {URI} from "../api/document.service";
import {PageEventCollection} from "../api/storage/page.event";
import * as log4js from "@log4js-node/log4js-api";

const logger: log4js.Logger = log4js.getLogger("pdf-wrap");

/**
 * A wrapper for each registered {@link StorageAdapter}.
 * Its purpose is to wrap all adapters into one.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class StorageAdapterWrapper implements StorageAdapter {

    constructor(
        private readonly storageRegistry: StorageRegistry
    ) {}

    /**
     * Loads the page overlays of the file by the given {@link URI}
     * and the given {@code pageNumber}.
     *
     * All available {@link StorageAdapter} are used to perform this operation.
     * The first adapter which resolves its data will be resolved by this operation.
     * If any adapter makes usage of the {@link SkippableStorageAdapter}, the next
     * adapter will be used.
     *
     * @param {URI} uri - the file uri
     * @param {number} pageNumber - the page number to load the data
     *
     * @returns {Promise<PageOverlay>} the page overlay data
     * @throws {Error} if no adapter could be found
     */
    async loadPage(uri: URI, pageNumber: number): Promise<PageOverlay> {

        const adapters: Array<StorageAdapter> = this.storageRegistry.get(uri);

        for (const adapter of adapters) {
            try {
                return await adapter.loadPage(uri, pageNumber);
            } catch (e) {
                logger.info("Skip storage adapter");
            }
        }

        throw new Error(`Could not load page, no storage adapter found for given URI: uri=${uri.uri}`);
    }

    /**
     * @throws {Error} always throws an {@link Error} indicating that this method must not be invoked
     */
    register(): URI {
        logger.error("StorageAdapterWrapper.register() method MUST NOT be invoked");
        throw new Error("StorageAdapterWrapper must not be registered");
    }

    /**
     * Delegates the given parameters to each {@link StorageAdapter} matching the given {@code uri}.
     *
     * @param {URI} uri - the file url
     * @param {PageEventCollection} events - the event collection to use
     */
    start(uri: URI, events: PageEventCollection): void {
        this.storageRegistry.get(uri)
            .forEach((it) => it.start(uri, events));
    }
}
