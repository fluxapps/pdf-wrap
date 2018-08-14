import {StorageAdapterWrapper} from "../../src/pdfjs/storage-adapter-wrapper";
import {StorageRegistry} from "../../src/api/storage/adapter.registry";
import {anyNumber, anything, instance, mock, verify, when} from "ts-mockito";
import {PageOverlay, StorageAdapter, UnfinishedExecutionError} from "../../src/api/storage/adapter";
import {URI} from "../../src/api/document.service";
import * as chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

class MockStorageAdapter implements StorageAdapter {

    loadPage(): Promise<PageOverlay> {
        throw new Error("Not implemented test stub");
    }

    register(): URI {
        throw new Error("Not implemented test stub");
    }

    start(): void {
        throw new Error("Not implemented test stub");
    }
}

describe('a storage adapter wrapper', () => {

    describe('to load a page', () => {

        describe('on multiple registered storage adapters', () => {

            it('should return the result of the  first one', async () => {

                const mockStorageAdapter1: StorageAdapter = mock(MockStorageAdapter);
                when(mockStorageAdapter1.loadPage(anything(), anyNumber())).thenResolve(new PageOverlay(1, [], []));

                const mockStorageAdapter2: StorageAdapter = mock(MockStorageAdapter);

                const mockStorageRegistry: StorageRegistry = mock(StorageRegistry);
                when(mockStorageRegistry.get(anything())).thenReturn([
                    instance(mockStorageAdapter1),
                    instance(mockStorageAdapter2)
                ]);


                const storageProvider: StorageAdapterWrapper = new StorageAdapterWrapper(instance(mockStorageRegistry));
                await storageProvider.loadPage(URI.from("file://"), 1);


                verify(mockStorageAdapter1.loadPage(anything(), anyNumber())).once();
                verify(mockStorageAdapter2.loadPage(anything(), anyNumber())).never();
            });
        });

        describe('on multiple registered storage adapters with a skippable adapter', () => {

            it('should return the third one', async() => {

                const mockStorageAdapter1: StorageAdapter = mock(MockStorageAdapter);
                when(mockStorageAdapter1.loadPage(anything(), anyNumber())).thenReject(new UnfinishedExecutionError("Skip adapter 1"));

                const mockStorageAdapter2: StorageAdapter = mock(MockStorageAdapter);
                when(mockStorageAdapter2.loadPage(anything(), anyNumber())).thenReject(new UnfinishedExecutionError("Skip adapter 2"));

                const mockStorageAdapter3: StorageAdapter = mock(MockStorageAdapter);
                when(mockStorageAdapter3.loadPage(anything(), anyNumber())).thenResolve(new PageOverlay(1, [], []));

                const mockStorageRegistry: StorageRegistry = mock(StorageRegistry);
                when(mockStorageRegistry.get(anything())).thenReturn([
                    instance(mockStorageAdapter1),
                    instance(mockStorageAdapter2),
                    instance(mockStorageAdapter3),
                ]);


                const storageProvider: StorageAdapterWrapper = new StorageAdapterWrapper(instance(mockStorageRegistry));
                await storageProvider.loadPage(URI.from("file://"), 1);


                verify(mockStorageAdapter1.loadPage(anything(), anyNumber())).once();
                verify(mockStorageAdapter2.loadPage(anything(), anyNumber())).once();
                verify(mockStorageAdapter3.loadPage(anything(), anyNumber())).once();
            });
        });

        describe('on no registered storage adapter', () => {

            it('should throw an error indicating that no storage adapter could be found', async() => {

                const mockStorageRegistry: StorageRegistry = mock(StorageRegistry);
                when(mockStorageRegistry.get(anything())).thenReturn([]);


                const storageProvider: StorageAdapterWrapper = new StorageAdapterWrapper(instance(mockStorageRegistry));


                await chai.expect(storageProvider.loadPage(URI.from("file://example-file"), 1))
                    .to.be.rejectedWith(Error)
                    .and.eventually.have.property("message", "Could not load page, no storage adapter found for given URI: uri=file://example-file");
            });
        });
    });
});
