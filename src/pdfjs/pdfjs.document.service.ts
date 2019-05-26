import {
    getDocument,
    GlobalWorkerOptions,
    OutlineDestination,
    PageRef,
    PageViewPort,
    PDFDocumentProxy,
    PDFOutline
} from "pdfjs-dist";
import {
    EventBus,
    PageChangingEvent,
    PageRenderedEvent,
    PagesLoadedEvent,
    PageView,
    PDFFindController,
    PDFLinkService,
    PDFViewer,
    RenderingType,
    TextLayerMode
} from "pdfjs-dist/web/pdf_viewer";
import { Subject } from "rxjs";
import { fromPromise, Subscriber } from "rxjs/internal-compatibility";
import { Observable } from "rxjs/internal/Observable";
import { fromArray } from "rxjs/internal/observable/fromArray";
import { fromEvent } from "rxjs/internal/observable/fromEvent";
import { merge } from "rxjs/internal/observable/merge";
import { of } from "rxjs/internal/observable/of";
import { TeardownLogic } from "rxjs/internal/types";
import { first, flatMap, map, mergeMap, takeUntil, tap } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { LoadingOptions, PDFDocumentService } from "../api/document.service";
import { Outline, PageThumbnail, TreeOutlineEntry } from "../api/document/document.info";
import { PDFDocument, ScalePreset } from "../api/document/pdf.document";
import { Point } from "../api/draw/draw.basic";
import { Circle, Ellipse, Line, PolyLine, Rectangle } from "../api/draw/elements";
import { PageChangeEvent, StateChangeEvent } from "../api/event/event.api";
import { Highlighting } from "../api/highlight/highlight.api";
import { DocumentSearch } from "../api/search/search.api";
import { StorageRegistry } from "../api/storage/adapter.registry";
import { PageEventCollection } from "../api/storage/page.event";
import { Forms } from "../api/tool/forms";
import { Toolbox } from "../api/tool/toolbox";
import { LoggerFactory } from "../log-config";
import { Canvas } from "../paint/painters";
import { DocumentModel, Page } from "./document.model";
import { PDFjsDocumentSearch } from "./document.search";
import { TextHighlighting } from "./highlight";
import { LayerManager } from "./layer-manager";
import { PDFjsPageEvenCollection } from "./page-event-collection";
import { RescaleManager } from "./rescale-manager";
import { StorageAdapterWrapper } from "./storage-adapter-wrapper";
import { FormFactory } from "./tool/forms";
import { EraserTool, FreehandTool } from "./tool/tools";

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

        const dispose$: Subject<void> = new Subject<void>();
        const pdfData: ArrayBuffer = await this.readBlob(options.pdf);
        const eventBus: EventBus = new EventBus();

        const fullyLoadPdf: Promise<PDFDocument> = new Observable((subscriber: Subscriber<PagesLoadedEvent>): TeardownLogic => {
            this.log.trace("Listen on pagesloaded event");
            eventBus.on("pagesloaded", (it) => subscriber.next(it));
        })
            .pipe(first())
            .pipe(tap((_) => this.log.debug("'pagesloaded' event received.")))
            .pipe(map(() => new PDFjsDocument(
                viewer,
                highlighting,
                {freehand, eraser, forms},
                searchController,
                (): void => { dispose$.next(); dispose$.complete(); }
            )))
            .toPromise();

        this.log.trace(() => "Get document from array buffer");
        const pdf: PDFDocumentProxy = await getDocument({
            cMapPacked: true,
            cMapUrl: mapUrl,
            data: pdfData,
            maxImageSize: 4096 * 4096
        }).promise;

        const linkService: PDFLinkService = new PDFLinkService({
            eventBus,
            externalLinkRel: "noopener noreferrer nofollow",
            externalLinkTarget: 0
        });

        const findController: PDFFindController = new PDFFindController({
            eventBus,
            linkService
        });

        this.log.trace(() => "Create PDF viewer");
        const viewer: PDFViewer = new PDFViewer({
            container: options.container,
            enablePrintAutoRotate: false,
            enableWebGL: true,
            eventBus,
            findController,
            linkService,
            removePageBorders: false,
            renderInteractiveForms: false,
            renderer: RenderingType.CANVAS,
            textLayerMode: TextLayerMode.ENABLE_ENHANCED,
            useOnlyCssZoom: false
        });

        viewer.renderingQueue.onIdle = (): void => {
            if (!pdf) {
                return; // run cleanup when document is loaded
            }
            viewer.cleanup();

            // We don't want to remove fonts used by active page SVGs.
            if (viewer.renderer !== RenderingType.SVG) {
                pdf.cleanup();
            }
        };

        linkService.setViewer(viewer);

        this.log.trace(() => "Set document on PDF viewer");
        linkService.setDocument(pdf);
        viewer.setDocument(pdf);

        const documentModel: DocumentModel = new DocumentModel(options.container,

            merge(fromArray([1]), fromPromise(fullyLoadPdf)
                .pipe(
                    first<PDFDocument>(),
                    flatMap((it) => it.pageChange),
                    map((it) => it.pageNumber)
                )
            )
        );

        const rescaleManager: RescaleManager = new RescaleManager(viewer);

        const searchController: DocumentSearch = new PDFjsDocumentSearch(findController);
        const highlighting: TextHighlighting = new TextHighlighting(documentModel);
        const freehand: FreehandTool = new FreehandTool(documentModel, rescaleManager);
        const eraser: EraserTool = new EraserTool(documentModel);
        const forms: Forms = new FormFactory(documentModel, rescaleManager);

        const pageEventCollection: PageEventCollection = new PDFjsPageEvenCollection(
            freehand.afterLineRendered.pipe(takeUntil(dispose$)),
            eraser.afterElementRemoved.pipe(takeUntil(dispose$)),
            highlighting.onTextSelection.pipe(takeUntil(dispose$)),
            forms.rectangle.afterPaintCompleted.pipe(takeUntil(dispose$)),
            forms.ellipse.afterPaintCompleted.pipe(takeUntil(dispose$)),
            forms.circle.afterPaintCompleted.pipe(takeUntil(dispose$)),
            forms.line.afterPaintCompleted.pipe(takeUntil(dispose$)),
            rescaleManager
        );
        const storageAdapter: StorageAdapterWrapper = new StorageAdapterWrapper(StorageRegistry.instance);

        storageAdapter.start(options.layerStorage, pageEventCollection);

        // move draw layers to front in order to make the mouse listeners work
        merge(freehand.stateChange, eraser.stateChange)
            .pipe(takeUntil(dispose$))
            .subscribe(moveDrawLayerToFront);

        new Observable((subscriber: Subscriber<PageRenderedEvent>): TeardownLogic => {
            this.log.trace("Listen on pagerendered event");
            const eventHandler: (ev: PageRenderedEvent) => void = (ev: PageRenderedEvent): void => subscriber.next(ev);
            viewer.eventBus.on("pagerendered", eventHandler);
            return (): void => viewer.eventBus.off("pagerendered", eventHandler);
        })
            .pipe(map((it) => new LayerManager(it)))
            .pipe(takeUntil(dispose$))
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
                            drawRectangle(highlightTransparencyLayer, rescaleManager.rescaleRectangle(highlight));
                        });

                    pageData.drawings
                        .forEach((drawing) => drawPolyline(drawLayer, rescaleManager.rescalePolyLine(drawing)));

                    pageData.rectangles
                        .forEach((rectangles) => drawRectangle(drawLayer, rescaleManager.rescaleRectangle(rectangles)));

                    pageData.ellipses
                        .forEach((ellipses) => drawEllipse(drawLayer, rescaleManager.rescaleEllipse(ellipses)));

                    pageData.circles
                        .forEach((circles) => drawCircle(drawLayer, rescaleManager.rescaleCircle(circles)));

                    pageData.lines
                        .forEach((lines) => drawLine(drawLayer, rescaleManager.rescaleLine(lines)));
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
    readonly dispose$: Subject<void> = new Subject<void>();

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/pdfjs.document.service:PDFjsDocument");

    constructor(
        private readonly viewer: PDFViewer,
        private readonly _highlighting: TextHighlighting,
        readonly toolbox: Toolbox,
        readonly searchController: DocumentSearch,
        private dispose: (() => void) | null
    ) {

        this.pageChange = new Observable((subscriber: Subscriber<PageChangingEvent>): TeardownLogic => {
            const eventHandler: (ev: PageChangingEvent) => void = (ev: PageChangingEvent): void => subscriber.next(ev);
            this.viewer.eventBus.on("pagechanging", eventHandler);
            return (): void => {
                viewer.eventBus.off("pagechanging", eventHandler);
                this.log.debug("Unsubscribed from 'pagechanging event'");
            };
        })
            .pipe(map((it) => new PageChangeEvent(it.pageNumber)))
            .pipe(takeUntil(this.dispose$));

        this.pageCount = this.viewer.pdfDocument.numPages;
    }

    get highlighting(): Highlighting {
        return this._highlighting;
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

    scaleTo(preset: ScalePreset): void {
        this.viewer.currentScaleValue = preset;
    }

    async close(): Promise<void> {
        this.viewer.renderingQueue.onIdle = null;
        if (this.viewer.renderingQueue.idleTimeout) {
            clearTimeout(this.viewer.renderingQueue.idleTimeout);
            this.viewer.renderingQueue.idleTimeout = null;
        }
        this._highlighting.dispose();
        this.viewer.pdfDocument.cleanup();
        await this.viewer.pdfDocument.destroy();
        this.viewer.setDocument(null);
        this.viewer.linkService.setDocument(null);
        this.viewer.findController._reset();
        this.viewer.linkService.setViewer(null);
        this.viewer.renderingQueue.setViewer(null);
        this.viewer.cleanup();
        if (!!this.dispose) {
            this.dispose();
            this.dispose = null;
        }
        this.dispose$.next();
        this.dispose$.complete();
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
function drawPolyline(on: Canvas, drawing: PolyLine): void {
    on.polyLine()
    .id(drawing.id)
    .borderColor(drawing.borderColor)
    .borderWidth(drawing.borderWidth)
    .coordinates(drawing.coordinates)
    .paint();
}

/**
 * Draws the given {@code ellipse} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {Ellipse} ellipse - the ellipse to draw
 */
function drawEllipse(on: Canvas, ellipse: Ellipse): void {
    on.ellipse()
        .id(ellipse.id)
        .dimension(ellipse.dimension)
        .position(ellipse.position)
        .fillColor(ellipse.fillColor)
        .borderColor(ellipse.borderColor)
        .borderWidth(ellipse.borderWidth)
        .paint();
}

/**
 * Draws the given {@code circle} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {Ellipse} circle - the circle to draw
 */
function drawCircle(on: Canvas, circle: Circle): void {
    on.circle()
        .id(circle.id)
        .diameter(circle.diameter)
        .position(circle.position)
        .fillColor(circle.fillColor)
        .borderColor(circle.borderColor)
        .borderWidth(circle.borderWidth)
        .paint();
}

/**
 * Draws the given {@code line} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {Line} line - the line to draw
 */
function drawLine(on: Canvas, line: Line): void {
    on.line()
        .id(line.id)
        .start(line.start)
        .end(line.end)
        .borderColor(line.borderColor)
        .borderWidth(line.borderWidth)
        .paint();
}

/**
 * Draws the given {@code rectangle} on the given {@code on} {@link Canvas}.
 *
 * @param {Canvas} on - the canvas to draw on
 * @param {Rectangle} rectangle - the rectangle to draw
 */
function drawRectangle(on: Canvas, rectangle: Rectangle): void {

    on.rectangle()
    .id(rectangle.id)
    .dimension(rectangle.dimension)
    .position(rectangle.position)
    .fillColor(rectangle.fillColor)
    .borderColor(rectangle.borderColor)
    .borderWidth(rectangle.borderWidth)
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
