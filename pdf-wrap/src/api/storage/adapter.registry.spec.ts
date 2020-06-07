import * as chai from "chai";
import { URI } from "../../api";
import { PageOverlay, StorageAdapter, StorageRegistry } from "../../api/storage";


function mockStorageAdapter(uri: URI): StorageAdapter {
    /* tslint:disable: no-empty */
    return {
        loadPage: (_, __): Promise<PageOverlay> => Promise.resolve(new PageOverlay(1, [], [], [], [], [], [])),
        register: (): URI => uri,
        start: (_, __): void => {}
    };
    /* tslint:enable */
}

type AdapterMap = {adapterMap: Map<unknown, unknown>};

describe('a storage registry', () => {

    beforeEach(() => {
        ((StorageRegistry.instance as unknown) as AdapterMap).adapterMap = new Map(); // tslint:disable-line: no-any
    });

    describe('using a storage adapter', () => {

        describe('on a new storage adapter', () => {

            it('should return the added storage adapter', () => {

                const registry: StorageRegistry = StorageRegistry.instance;
                const mockAdapter: StorageAdapter = mockStorageAdapter(URI.from("ex://"));

                registry.add(mockAdapter);


                const storageAdapters: Array<StorageAdapter> = registry.get(URI.from("ex://"));


                chai.expect(storageAdapters[0]).to.equal(mockAdapter);
            });
        });

        describe('on a second storage adapter listening the same uri', () => {

            it('should return both adapters', () => {

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
                    .and.to.have.property("message", "No storage adapter available matching the given uri schema: schema=ex");
            });
        });
    });
});
