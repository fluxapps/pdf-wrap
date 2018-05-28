import {PageOverlay, StorageAdapter} from "../../../src/api/storage/adapter";
import {URI} from "../../../src/api/document.service";
import * as chai from "chai";
import {StorageRegistry} from "../../../src/api/storage/adapter.registry";


function mockStorageAdapter(uri: URI): StorageAdapter {
    /* tslint:disable: no-empty */
    return {
        loadPage: (_): Promise<PageOverlay> => Promise.resolve(new PageOverlay(1, [], [])),
        register: (): URI => uri,
        start: (_): void => {}
    };
    /* tslint:enable */
}

describe('a storage registry', () => {

    beforeEach(() => {
        (StorageRegistry.instance as any).adapterMap = new Map(); // tslint:disable-line: no-any
    });

    describe('using a storage adapter', () => {

        describe('on a new storage adapter', () => {

            it('should return the added storage adapter', () => {

                // tslint:disable-next-line: no-require-imports
                const registry: StorageRegistry = StorageRegistry.instance;
                const mockAdapter: StorageAdapter = mockStorageAdapter(URI.from("ex://"));

                registry.add(mockAdapter);


                const storageAdapters: Array<StorageAdapter> = registry.get(URI.from("ex://"));


                chai.expect(storageAdapters[0]).to.equal(mockAdapter);
            });
        });

        describe('on a second storage adapter listening the same uri', () => {

            it('should return both adapters', () => {

                // tslint:disable-next-line: no-require-imports
                const registry: StorageRegistry = StorageRegistry.instance;
                const firstMockAdapter: StorageAdapter = mockStorageAdapter(URI.from("ex://"));
                const secondMockAdapter: StorageAdapter = mockStorageAdapter(URI.from("ex://"));

                registry
                    .add(firstMockAdapter)
                    .add(secondMockAdapter);


                const storageAdapters: Array<StorageAdapter> = registry.get(URI.from("ex://"));


                chai.expect(storageAdapters).to.deep.equal([firstMockAdapter, secondMockAdapter]);
            });
        });

        describe('on storage adapter matching the uri does not exist', () => {

            it('should throw an error indicating that no adapter exists', () => {

                chai.expect(() => StorageRegistry.instance.get(URI.from("ex://")))
                    .to.throw(Error)
                    .and.to.have.property("message", "No storage adapter available matching the given uri schema: schema=ex"); // tslint:disable-line: max-line-length
            });
        });
    });
});