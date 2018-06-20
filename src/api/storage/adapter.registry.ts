import {StorageAdapter} from "./adapter";
import {URI} from "../document.service";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../../log-config";

/**
 * The registry to add {@link StorageAdapter} instances.
 * This registry is a singleton and must be accessed with {@code StorageRegistry#instance}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class StorageRegistry {

    static readonly instance: StorageRegistry = new StorageRegistry();

    private readonly adapterMap: Map<string, Array<StorageAdapter>> = new Map();

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/api/storage/adapter.registry:StorageRegistry");

    private constructor() {}

    /**
     * Adds the given {@code adapter} to this registry.
     *
     * @param {StorageAdapter} adapter - the storage adapter to add
     */
    add(adapter: StorageAdapter): StorageRegistry {

        this.log.info(`Add storage adapter to registry: class=${adapter.constructor.name}`);

        const uri: URI = adapter.register();

        if (this.adapterMap.has(uri.schema)) {
            this.adapterMap.get(uri.schema)!.push(adapter);
        } else {
            this.adapterMap.set(uri.schema, [adapter]);
        }

        return this;
    }

    /**
     * Returns all storage adapter listening on the given {@code uri} schema.
     *
     * @param {URI} uri - the uri for the schema match
     *
     * @returns {Array<StorageAdapter>} all available storage adapters
     * @throws {Error} if no storage adapter for the given {@code uri} schema exists
     */
    get(uri: URI): Array<StorageAdapter> {

        const adapters: Array<StorageAdapter> | undefined = this.adapterMap.get(uri.schema);

        if (adapters === undefined || adapters.length < 1) {
            throw new Error(`No storage adapter available matching the given uri schema: schema=${uri.schema}`);
        }

        return adapters;
    }
}
