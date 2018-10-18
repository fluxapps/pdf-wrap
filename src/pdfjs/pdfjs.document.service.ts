import {LoadingOptions, PDFDocumentService} from "../api/document.service";
import {PDFDocument} from "../api/document/pdf.document";
import {Outline, PageThumbnail, TreeOutlineEntry} from "../api/document/document.info";
import {Observable} from "rxjs/internal/Observable";
import {Toolbox} from "../api/tool/toolbox";
import {PageChangeEvent, StateChangeEvent} from "../api/event/event.api";
import {Highlighting} from "../api/highlight/highlight.api";
import {
    EventBus,
    PageChangingEvent,
    PageRenderedEvent, PagesLoadedEvent,
    PageView,
    PDFFindController, PDFLinkService,
    PDFViewer, RenderingType, TextLayerMode
} from "pdfjs-dist/web/pdf_viewer";
import {
    getDocument,
    GlobalWorkerOptions,
    OutlineDestination,
    PageRef,
    PageViewPort,
    PDFDocumentProxy,
    PDFOutline
} from "pdfjs-dist";
import {fromPromise, Subscriber} from "rxjs/internal-compatibility";
import {DocumentModel, Page} from "./document.model";
import {first, map, mergeMap} from "rxjs/operators";
import {TextHighlighting} from "./highlight";
import {EraserTool, FreehandTool} from "./tool/tools";
import {TeardownLogic} from "rxjs/internal/types";
import {Canvas} from "../paint/painters";
import {Point} from "../api/draw/draw.basic";
import {StorageRegistry} from "../api/storage/adapter.registry";
import {StorageAdapterWrapper} from "./storage-adapter-wrapper";
import {PageEventCollection} from "../api/storage/page.event";
import {PDFjsPageEvenCollection} from "./page-event-collection";
import {merge} from "rxjs/internal/observable/merge";
import {PolyLine, Rectangle} from "../api/draw/elements";
import {DocumentSearch} from "../api/search/search.api";
import {PDFjsDocumentSearch} from "./document.search";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";
import {RescaleManager} from "./rescale-manager";
import {of} from "rxjs/internal/observable/of";
import {fromEvent} from "rxjs/internal/observable/fromEvent";
import {LayerManager} from "./layer-manager";

// PDF.js defaults
GlobalWorkerOptions.workerSrc = "assets/pdf.worker.js";
let mapUrl: string = "assets/cmaps";

/**
 * Sets the assets directory.
 *
 * The parameter should be relative to your websites root directory
 * without starting './' or trailing '/'.
 *
 * e.g. "resources/pdf-wrap"
 *
 * @param {string} src - the relative src to the assets dierctory
 */
export function setAssetsSrc(src: string): void {
    GlobalWorkerOptions.workerSrc = `${src}/pdf.worker.js`;
    mapUrl = `${src}/cmaps`;
}

/**
 * {@link PDFDocumentService} implementation for PDF.js.
 *
 * This class relies very much on the PDF.js library.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsDocumentService implements PDFDocumentService {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/pdfjs.document.service:PDFjsDocumentService");

    /**
     * Loads a PDF by the given loading options, displays it
     * and returns a {@link PDFDocument} to operate with the document.
     *
     * The PDF that is being rendered will always be rendered as an svg element.
     *
     * This method will listen on page rendering from PDF.js and adds different additional layers
     * to the DOM.
     *
     * @param {LoadingOptions} options - the options to determine how to load the document
     *
     * @returns {Promise<PDFDocument>} the resulting document
     */
    async loadWith(options: LoadingOptions): Promise<PDFDocument> {

        return this._loadWith(options)
            .then((it) => it)
            .catch((error) => {
                this.log.error(() => `Error occurred during PDF loading: error=${error}`);
                throw error;
            });
    }

    // just as a private method so we can catch the error a bit more readable, because this method is already quite messy
    private async _loadWith(options: LoadingOptions): Promise<PDFDocument> {

        this.log.info(() => `Load PDF file`);

        const pdfData: ArrayBuffer = await this.readBlob(options.pdf);
        const eventBus: EventBus = new EventBus();

        const fullyLoadPdf: Promise<PDFDocument> = new Observable((subscriber: Subscriber<PagesLoadedEvent>): TeardownLogic => {
            this.log.trace("Listen on pagesinit event");
            eventBus.on("pagesloaded", (it) => subscriber.next(it));
        })
            .pipe(first())
            .pipe(map(() => new PDFjsDocument(viewer, highlighting, {freehand, eraser}, searchController)))
            .toPromise();

        const linkService: PDFLinkService = new PDFLinkService({eventBus});

        this.log.trace(() => "Create PDF viewer");
        const viewer: PDFViewer = new PDFViewer({
            container: options.container,
            enableWebGL: true,
            eventBus,
            linkService,
            renderer: RenderingType.CANVAS,
            textLayerMode: TextLayerMode.ENABLE_ENHANCED
        });

        this.log.trace(() => "Get document from array buffer");
        const pdf: PDFDocumentProxy = await getDocument({
            MapUrl: mapUrl,
            cMapPacked: true,
            data: pdfData
        });

        linkService.setDocument(pdf);
        linkService.setViewer(viewer);

        this.log.trace(() => "Set document on PDF viewer");
        viewer.setDocument(pdf);

        const findController: PDFFindController = new PDFFindController({
            pdfViewer: viewer
        });
        this.log.trace(() => "Set find controller on PDF viewer");
        viewer.setFindController(findController);

        const documentModel: DocumentModel = new DocumentModel(options.container);

        const searchController: DocumentSearch = new PDFjsDocumentSearch(findController);
        const highlighting: Highlighting = new TextHighlighting(documentModel);
        const freehand: FreehandTool = new FreehandTool(documentModel);
        const eraser: EraserTool = new EraserTool(documentModel);

        const rescaleManager: RescaleManager = new RescaleManager(viewer);

        const pageEventCollection: PageEventCollection = new PDFjsPageEvenCollection(
            freehand.afterLineRendered,
            eraser.afterElementRemoved,
            highlighting.onTextSelection,
            rescaleManager
        );
        const storageAdapter: StorageAdapterWrapper = new StorageAdapterWrapper(StorageRegistry.instance);

        storageAdapter.start(options.layerStorage, pageEventCollection);

        // move draw layers to front in order to make the mouse listeners work
        merge(freehand.stateChange, eraser.stateChange).subscribe(moveDrawLayerToFront);

        new Observable((subscriber: Subscriber<PageRenderedEvent>): TeardownLogic => {
            this.log.trace("Listen on pagerendered event");
            viewer.eventBus.on("pagerendered", (ev) => subscriber.next(ev));
        })
            .pipe(map((it) => new LayerManager(it)))
            .subscribe((it) => {

                // we remove possible outdated layers, otherwise we could get duplicated ones
                it.removeLayers();

                const highlightLayer: Canvas = it.createHighlightLayer();
                const highlightTransparencyLayer: Canvas = it.createHighlightTransparencyLayer();
                const drawLayer: Canvas = it.createDrawingLayer();

                // this can easily made async without awaiting it
                this.log.trace(() => `Load page data: pageNumber=${it.pageNumber}`);
                storageAdapter.loadPage(options.layerStorage, it.pageNumber).then((pageData) => {

                    pageData.highlightings
                        .forEach((highlight) => {
                            drawHighlight(highlightTransparencyLayer, rescaleManager.rescaleRectangle(highlight));
                        });

                    pageData.drawings
                        .forEach((drawing) => draw(drawLayer, rescaleManager.rescalePolyLine(drawing)));
                });

                const page: Page = new Page(
                    it.pageNumber,
                    it.pageContainer,
                    highlightLayer,
                    it.pdfLayer,
                    highlightTransparencyLayer,
                    drawLayer,
                    it.textLayer,
                    {height: it.height, width: it.width},
                    (): Point => {
                        const pageView: PageView = viewer.getPageView(it.pageIndex);
                        const pageRects: ClientRect = pageView.canvas.getClientRects()[0];
                        return {
                            x: pageRects.left,
                            y: pageRects.top
                        };
                    }
                );

                documentModel.addPage(page);
            });

        return fullyLoadPdf;
    }

    private readBlob(data: Blob): Promise<ArrayBuffer> {

        const fileReader: FileReader = new FileReader();
        const fileLoadend: Promise<ArrayBuffer> = fromEvent<ArrayBuffer>(fileReader, "loadend")
            .pipe(first())
            .pipe(map(() => fileReader.result as ArrayBuffer))
            .toPromise();

        fromEvent(fileReader, "error").subscribe((error) => {
            this.log.error(() => `Could not read options.pdf: error=${error}`);
        });

        fileReader.readAsArrayBuffer(data);

        return fileLoadend;
    }
}

/**
 * {@link PDFDocument} implementation for PDF.js.
 *
 * A lot of operations are either completely delegated or partially
 * delegated to the PDFViewer instance.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsDocument implements PDFDocument {

    get currentPageNumber(): number {
        return this.viewer.currentPageNumber;
    }

    set currentPageNumber(currentPageNumber: number) {
        this.log.trace(() => `Set current page number to ${currentPageNumber}`);
        this.viewer.currentPageNumber = currentPageNumber;
    }

    get scale(): number {
        return this.viewer.currentScale;
    }

    set scale(scale: number) {
        this.log.trace(() => `Set scale to ${scale}`);
        this.viewer.currentScale = scale;
    }

    readonly pageChange: Observable<PageChangeEvent>;
    readonly pageCount: number;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/pdfjs.document.service:PDFjsDocument");

    constructor(
        private readonly viewer: PDFViewer,
        readonly highlighting: Highlighting,
        readonly toolbox: Toolbox,
        readonly searchController: DocumentSearch
    ) {

        this.pageChange = new Observable((subscriber: Subscriber<PageChangingEvent>): TeardownLogic => {
            this.viewer.eventBus.on("pagechanging", (evt) => subscriber.next(evt));
        })
            .pipe(map((it) => new PageChangeEvent(it.pageNumber)));

        this.pageCount = this.viewer.pdfDocument.pdfInfo.numPages;
    }

    /**
     * If an error occurs during the outline parsing, an empty outline
     * will be returned.
     *
     * @returns {Promise<Outline>} returns the outline of the pdf
     */
    async getOutline(): Promise<Outline> {

        try {

            this.log.trace(() => "Get outline of PDF");

            const pdfOutline: PDFOutline = await this.viewer.pdfDocument.getOutline();

            const transformedOutline: Array<TreeOutlineEntry> = await this.transformOutline(pdfOutline);

            return new Outline(transformedOutline);
        } catch (e) {
            /*
             * The reason we return an empty outline is, that it seems to work sometimes and sometimes
             * not. It is outside our control, because PDF.js does the parsing.
             */
            this.log.warn(() => `Could not get outline: error=${e.message}`);
            return new Outline([]);
        }
    }

    /**
     * Returns a observable which emits a {@link PageThumbnail} for each given page number.
     * The observable completes when the last thumbnail is emitted.
     *
     * If the {@code maxSize} parameter is greater than the max width or height of the PDF page,
     * the size of the PDF page will be used.
     *
     * @param {number} maxSize - the max width or height of the thumbnails
     * @param {number} pageNumbers - the page numbers for the thumbnails that should be returned
     *
     * @returns {Observable<PageThumbnail>} a observable which emits the thumbnails
     */
    getThumbnails(maxSize: number, ...pageNumbers: Array<number>): Observable<PageThumbnail> {

        return of(...pageNumbers)
            .pipe(mergeMap((it) => fromPromise(this.viewer.pdfDocument.getPage(it))))
            .pipe(mergeMap((it) => {

                const viewport: PageViewPort = it.getViewport(1);

                // calculate the ratio of the maxSize to the original page width and than use the smallest to not be larger than maxSize
                const scale: number = Math.min(maxSize / viewport.width, maxSize / viewport.height);

                const rescaledViewport: PageViewPort = it.getViewport(scale);

                const canvas: HTMLCanvasElement = document.createElement("canvas");
                canvas.height = rescaledViewport.height;
                canvas.width = rescaledViewport.width;

                // we have to wait for the render method, then the canvas is ready
                return fromPromise(
                    it.render({
                        canvasContext: canvas.getContext("2d")!,
                        viewport: rescaledViewport
                    })
                )
                    .pipe(map(() => new PageThumbnail(canvas, it.pageNumber)));
            }));
    }

    close(): Promise<void> {
        this.viewer.pdfDocument.cleanup();
        return this.viewer.pdfDocument.destroy();
    }

    /**
     * Transforms the PDF.js outline object to get the page number and the title of the outline.
     *
     * @param {module:pdfjs-dist.PDFOutline} outline - the outline to transform
     *
     * @returns {Promise<Array<TreeOutlineEntry>>} the transformed outline as a {@link TreeOutlineEntry} array
     */
    private async transformOutline(outline: PDFOutline): Promise<Array<TreeOutlineEntry>> {

        const out: Array<TreeOutlineEntry> = [];

        for (const it of Array.from(outline)) {
            const destination: OutlineDestination = await this.viewer.pdfDocument.getDestination(it.dest);

            this.log.debug(() => `Outline destination: destination=${JSON.stringify(destination)}`);

            const pageRef: PageRef = destination[0];
            const destPageNumber: number = (await this.viewer.pdfDocument.getPageIndex(pageRef)) + 1;

            const children: Array<TreeOutlineEntry> = [];

            if (it.items) {
                children.push(...(await this.transformOutline(it.items)));
            }

            out.push(new TreeOutlineEntry(
                it.title,
                destPageNumber,
                children
            ));
        }

        return out;
    }
}

/**
 * Draws the given {@code darwing} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {PolyLine} drawing - the drawing to draw
 */
function draw(on: Canvas, drawing: PolyLine): void {
    on.polyLine()
    .id(drawing.id)
    .borderColor(drawing.borderColor)
    .borderWidth(drawing.borderWidth)
    .coordinates(drawing.coordinates)
    .paint();
}

/**
 * Draws the given {@code highlight} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {Rectangle} highlight - the highlight to draw
 */
function drawHighlight(on: Canvas, highlight: Rectangle): void {

    on.rectangle()
    .id(highlight.id)
    .dimension(highlight.dimension)
    .position(highlight.position)
    .fillColor(highlight.fillColor)
    .borderColor(highlight.borderColor)
    .borderWidth(highlight.borderWidth)
    .paint();
}

/**
 * Moves any draw layer to the front or back depending on
 * what state is given.
 *
 * @param {StateChangeEvent} stateEvent - the state to move the draw layer in front or back
 */
function moveDrawLayerToFront(stateEvent: StateChangeEvent): void {

    const drawLayerList: Array<Element> = Array.from(document.getElementsByClassName("draw-layer"));

    if (stateEvent.isActive) {
        drawLayerList
            .forEach((drawLayer) => {
                drawLayer.classList.add("in-front");
            });
    } else {
        drawLayerList
            .forEach((drawLayer) => {
                drawLayer.classList.remove("in-front");
            });
    }
}
