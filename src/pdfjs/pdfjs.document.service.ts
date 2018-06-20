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
    PageRenderedEvent,
    PageView,
    PDFFindController,
    PDFViewer
} from "pdfjs-dist/web/pdf_viewer";
import {getDocument, GlobalWorkerOptions, OutlineDestination, PageRef, PDFDocumentProxy, PDFOutline} from "pdfjs-dist";
import {Subscriber} from "rxjs/internal-compatibility";
import {DocumentModel, Page} from "./document.model";
import {map} from "rxjs/operators";
import {TextHighlighting} from "./highlight";
import {EraserTool, FreehandTool} from "./tool/tools";
import {TeardownLogic} from "rxjs/internal/types";
import {Canvas, SVGCanvas} from "../paint/painters";
import svgjs from "svgjs";
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

GlobalWorkerOptions.workerSrc = "assets/pdf.worker.js";
let mapUrl: string = "assets/cmaps";

export function setWorkerSrc(url: string): void {
    GlobalWorkerOptions.workerSrc = url;
}

export function setMapUrl(url: string): void {
    mapUrl = url;
}

/**
 *
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsDocumentService implements PDFDocumentService {

    async loadWith(options: LoadingOptions): Promise<PDFDocument> {

        const viewer: PDFViewer = new PDFViewer({
            container: options.container,
            eventBus: new EventBus(),
            renderer: "svg"
        });

        const pdf: PDFDocumentProxy = await getDocument({
            MapUrl: mapUrl,
            cMapPacked: true,
            url: "assets/resources/chicken.pdf" // TODO: use blob
        });

        viewer.setDocument(pdf);

        const findController: PDFFindController = new PDFFindController({
            pdfViewer: viewer
        });
        viewer.setFindController(findController);

        const documentModel: DocumentModel = new DocumentModel(options.container);

        const searchController: DocumentSearch = new PDFjsDocumentSearch(findController);
        const highlighting: Highlighting = new TextHighlighting(documentModel);
        const freehand: FreehandTool = new FreehandTool(documentModel);
        const eraser: EraserTool = new EraserTool(documentModel);

        const pageEventCollection: PageEventCollection = new PDFjsPageEvenCollection(
            freehand.afterLineRendered,
            eraser.afterElementRemoved,
            highlighting.onTextSelection
        );
        const storageAdapter: StorageAdapterWrapper = new StorageAdapterWrapper(StorageRegistry.instance);

        storageAdapter.start(options.layerStorage, pageEventCollection);

        // move draw layers to front in order to make the mouse listeners work
        merge(freehand.stateChange, eraser.stateChange).subscribe(this.moveDrawLayerToFront);

        new Observable((subscriber: Subscriber<PageRenderedEvent>): TeardownLogic => {
            viewer.eventBus.on("pagerendered", (ev) => subscriber.next(ev));
        })
            .pipe(map((it) => new LayerManager(it)))
            .subscribe((it) => {

                const highlightLayer: Canvas = it.createHighlightLayer();
                const searchLayer: Canvas = it.createSearchLayer();
                const highlightTransparencyLayer: Canvas = it.createHighlightTransparencyLayer();
                const searchTransparencyLayer: Canvas = it.createSearchTransparencyLayer();
                const drawLayer: Canvas = it.createDrawingLayer();

                // this can easily made async without awaiting it
                storageAdapter.loadPage(options.layerStorage, it.pageNumber).then((pageData) => {

                    pageData.highlightings
                        .forEach((highlight) => {
                            this.drawHighlight(highlightLayer, highlight);
                            this.drawHighlight(highlightTransparencyLayer, highlight);
                        });

                    pageData.drawings
                        .forEach((drawing) => this.draw(drawLayer, drawing));
                });

                const page: Page = new Page(
                    it.pageNumber,
                    it.pageContainer,
                    highlightLayer,
                    searchLayer,
                    it.pdfLayer,
                    highlightTransparencyLayer,
                    searchTransparencyLayer,
                    drawLayer,
                    it.textLayer,
                    {height: it.height, width: it.width},
                    (): Point => {
                        const pageView: PageView = viewer.getPageView(it.pageIndex);
                        const pageRects: ClientRect = pageView.svg.getClientRects()[0];
                        return {
                            x: pageRects.left,
                            y: pageRects.top
                        };
                    }
                );

                documentModel.addPage(page);
            });

        return new PDFjsDocument(viewer, highlighting, {freehand, eraser}, searchController);
    }

    private moveDrawLayerToFront(stateEvent: StateChangeEvent): void {

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

    private drawHighlight(on: Canvas, highlight: Rectangle): void {

        on.rectangle()
            .id(highlight.id)
            .dimension(highlight.dimension)
            .position(highlight.position)
            .fillColor(highlight.fillColor)
            .borderColor(highlight.borderColor)
            .paint();
    }

    private draw(on: Canvas, drawing: PolyLine): void {
        on.polyLine()
            .id(drawing.id)
            .borderColor(drawing.borderColor)
            .coordinates(drawing.coordinates)
            .paint();
    }
}

/**
 *
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsDocument implements PDFDocument {

    readonly pageChange: Observable<PageChangeEvent>;
    readonly pageCount: number;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/pdfjs.document.service:PDFjsDocument");

    get currentPageNumber(): number {
        return this.viewer.currentPageNumber;
    }

    set currentPageNumber(currentPageNumber: number) {
        this.log.trace(`Set current page number to ${currentPageNumber}`);
        this.viewer.currentPageNumber = currentPageNumber;
    }

    get scale(): number {
        return this.viewer.currentScale;
    }

    set scale(scale: number) {
        this.log.trace(`Set scale to ${scale}`);
        this.viewer.currentScale = scale;
    }

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

        this.pageCount = this.viewer.pdfDocument.pdfInfo.numpages;
    }

    async getOutline(): Promise<Outline> {

        this.log.trace("Get outline of PDF");

        const pdfOutline: PDFOutline = await this.viewer.pdfDocument.getOutline();

        const transformedOutline: Array<TreeOutlineEntry> = await this.transformOutline(pdfOutline);

        return new Outline(transformedOutline);
    }

    getThumbnails(...pageNumbers: Array<number>): Observable<PageThumbnail> {
        throw new Error("Not implemented yet" + pageNumbers);
    }

    private async transformOutline(outline: PDFOutline): Promise<Array<TreeOutlineEntry>> {

        const out: Array<TreeOutlineEntry> = [];

        for (const it of Array.from(outline)) {
            const destination: OutlineDestination = await this.viewer.pdfDocument.getDestination(it.dest);
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
 *
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
class LayerManager {

    readonly pageContainer: HTMLDivElement;
    readonly pdfLayer: HTMLDivElement;
    readonly textLayer: HTMLDivElement;

    readonly width: number;
    readonly height: number;

    readonly pageNumber: number;

    get pageIndex(): number {
        return this.pageNumber - 1;
    }

    constructor(
        pageRenderedEvent: PageRenderedEvent
    ) {
        this.pageNumber = pageRenderedEvent.pageNumber;
        this.pageContainer = pageRenderedEvent.source.div;

        this.width = pageRenderedEvent.source.viewport.width;

        this.height = pageRenderedEvent.source.viewport.height;

        this.pdfLayer = this.pageContainer.getElementsByClassName("canvasWrapper").item(0) as HTMLDivElement;
        this.textLayer = this.pageContainer.getElementsByClassName("textLayer").item(0) as HTMLDivElement;
    }

    createHighlightLayer(): Canvas {

        const highlightDiv: HTMLDivElement = this.createLayerDiv(this.height, this.width);
        highlightDiv.setAttribute("id", `highlight-layer-page-${this.pageNumber}`);

        this.pageContainer.insertBefore(highlightDiv, this.pdfLayer);

        const highlightSVG: svgjs.Doc = svgjs(`${highlightDiv.id}`);
        return new SVGCanvas(highlightSVG);
    }

    createSearchLayer(): Canvas {

        const searchDiv: HTMLDivElement = this.createLayerDiv(this.height, this.width);
        searchDiv.setAttribute("id", `search-layer-page-${this.pageNumber}`);

        this.pageContainer.insertBefore(searchDiv, this.pdfLayer);

        const searchSVG: svgjs.Doc = svgjs(`${searchDiv.id}`);
        return new SVGCanvas(searchSVG);
    }

    createHighlightTransparencyLayer(): Canvas {

        const highlightTransparencyDiv: HTMLDivElement = this.createLayerDiv(this.height, this.width);
        highlightTransparencyDiv.setAttribute("id", `highlight-transparency-layer-page-${this.pageNumber}`);
        highlightTransparencyDiv.classList.add("transparent");

        this.pageContainer.insertBefore(highlightTransparencyDiv, this.textLayer);

        const highlightTransparencySVG: svgjs.Doc = svgjs(`${highlightTransparencyDiv.id}`);
        return new SVGCanvas(highlightTransparencySVG);
    }

    createSearchTransparencyLayer(): Canvas {

        const searchTransparencyDiv: HTMLDivElement = this.createLayerDiv(this.height, this.width);
        searchTransparencyDiv.setAttribute("id", `search-transparency-layer-page-${this.pageNumber}`);
        searchTransparencyDiv.classList.add("transparent");

        this.pageContainer.insertBefore(searchTransparencyDiv, this.textLayer);

        const searchTransparencySVG: svgjs.Doc = svgjs(`${searchTransparencyDiv.id}`);
        return new SVGCanvas(searchTransparencySVG);
    }

    createDrawingLayer(): Canvas {

        const drawDiv: HTMLDivElement = this.createLayerDiv(this.height, this.width);
        drawDiv.setAttribute("id", `draw-layer-page-${this.pageNumber}`);
        drawDiv.classList.add("draw-layer");

        this.pageContainer.insertBefore(drawDiv, this.textLayer);

        const drawSVG: svgjs.Doc = svgjs(`${drawDiv.id}`);
        return new SVGCanvas(drawSVG);
    }

    private  createLayerDiv(height: number, width: number): HTMLDivElement {

        const div: HTMLElementTagNameMap["div"] = window.document.createElement("div");
        div.setAttribute("style", `width: ${width}px; height: ${height}px`);
        div.classList.add("page-layer");

        return div;
    }
}
