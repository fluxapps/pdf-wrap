import {StorageAdapter} from "./adapter";
import {Map} from "gulp-typescript/release/utils";
import {URI} from "../document.service";

/**
 * The registry to add {@link StorageAdapter} instances.
 * This registry is a singleton and must be accessed with {@code StorageRegistry#instance}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class StorageRegistry {

    static readonly instance: StorageRegistry = new StorageRegistry();

    private readonly adapterMap: Map<Array<StorageAdapter>> = {};

    private constructor() {}

    /**
     * Adds the given {@code adapter} to this registry.
     *
     * @param {StorageAdapter} adapter - the storage adapter to add
     */
    add(adapter: StorageAdapter): StorageRegistry {

        const uri: URI = adapter.register();

        (this.adapterMap[uri.schema] || (this.adapterMap[uri.schema] = [])).push(adapter);

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

        const adapters: Array<StorageAdapter> | undefined = this.adapterMap[uri.schema];

        if (adapters === undefined || adapters.length < 1) {
            throw new Error(`No storage adapter available matching the given uri schema: schema=${uri.schema}`);
        }

        return adapters;
    }
}