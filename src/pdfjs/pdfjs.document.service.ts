import {LoadingOptions, PDFDocumentService} from "../api/document.service";
import {PDFDocument} from "../api/document/pdf.document";
import {Outline, PageThumbnail} from "../api/document/document.info";
import {Observable} from "rxjs/internal/Observable";
import {Eraser, Freehand, Toolbox} from "../api/tool/toolbox";
import {PageChangeEvent} from "../api/event/event.api";
import {Highlighting} from "../api/highlight/highlight.api";
import {PDFViewer, EventBus, PageChangingEvent, PageRenderedEvent, PageView} from "pdfjs-dist/web/pdf_viewer";
import {GlobalWorkerOptions, getDocument, PDFDocumentProxy} from "pdfjs-dist";
import {Subscriber} from "rxjs/internal-compatibility";
import {DocumentModel, Page} from "./document.model";
import {map} from "rxjs/operators";
import {TextHighlighting} from "./highlight";
import {EraserTool, FreehandTool} from "./tool/tools";
import {TeardownLogic} from "rxjs/internal/types";
import {Canvas, SVGCanvas} from "../paint/painters";
import svgjs from "svgjs";
import {Point} from "../api/draw/draw.basic";

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

        const documentModel: DocumentModel = new DocumentModel(options.container);

        const highlighting: Highlighting = new TextHighlighting(documentModel);
        const freehand: Freehand = new FreehandTool(documentModel);
        const eraser: Eraser = new EraserTool(documentModel);

        const pdfDocument: PDFDocument = new PDFjsDocument(viewer, highlighting, {freehand, eraser});

        new Observable((subscriber: Subscriber<PageRenderedEvent>): TeardownLogic => {
            viewer.eventBus.on("pagerendered", (ev) => subscriber.next(ev));
        })
            .subscribe((it) => {

                const pageContainer: HTMLDivElement = it.source.div;

                const height: number = it.source.viewport.height;
                const width: number = it.source.viewport.width;

                // textLayer and canvas are already rendered at this point
                const textLayer: HTMLDivElement = pageContainer.getElementsByClassName("textLayer").item(0) as HTMLDivElement;
                const pdfLayer: HTMLDivElement = pageContainer.getElementsByClassName("canvasWrapper").item(0) as HTMLDivElement;


                const highlightDiv: HTMLDivElement = createLayerDiv(height, width);
                highlightDiv.setAttribute("id", `highlight-layer-page-${it.pageNumber}`);

                pageContainer.insertBefore(highlightDiv, pdfLayer);

                const highlightSVG: svgjs.Doc = svgjs(`${highlightDiv.id}`);
                const highlightLayer: Canvas = new SVGCanvas(highlightSVG);


                const searchDiv: HTMLDivElement = createLayerDiv(height, width);
                searchDiv.setAttribute("id", `search-layer-page-${it.pageNumber}`);

                pageContainer.insertBefore(searchDiv, pdfLayer);

                const searchSVG: svgjs.Doc = svgjs(`${searchDiv.id}`);
                const searchLayer: Canvas = new SVGCanvas(searchSVG);


                const highlightTransparencyDiv: HTMLDivElement = createLayerDiv(height, width);
                highlightTransparencyDiv.setAttribute("id", `highlight-transparency-layer-page-${it.pageNumber}`);
                highlightTransparencyDiv.classList.add("transparent");

                pageContainer.insertBefore(highlightTransparencyDiv, textLayer);

                const highlightTransparencySVG: svgjs.Doc = svgjs(`${highlightTransparencyDiv.id}`);
                const highlightTransparencyLayer: Canvas = new SVGCanvas(highlightTransparencySVG);


                const searchTransparencyDiv: HTMLDivElement = createLayerDiv(height, width);
                searchTransparencyDiv.setAttribute("id", `search-transparency-layer-page-${it.pageNumber}`);
                searchTransparencyDiv.classList.add("transparent");

                pageContainer.insertBefore(searchTransparencyDiv, textLayer);

                const searchTransparencySVG: svgjs.Doc = svgjs(`${searchTransparencyDiv.id}`);
                const searchTransparencyLayer: Canvas = new SVGCanvas(searchTransparencySVG);


                const drawDiv: HTMLDivElement = createLayerDiv(height, width);
                drawDiv.setAttribute("id", `draw-layer-page-${it.pageNumber}`);

                pageContainer.insertBefore(drawDiv, textLayer);

                const drawSVG: svgjs.Doc = svgjs(`${drawDiv.id}`);
                const drawLayer: Canvas = new SVGCanvas(drawSVG);

                const page: Page = new Page(
                    it.pageNumber,
                    pageContainer,
                    highlightLayer,
                    searchLayer,
                    pdfLayer,
                    highlightTransparencyLayer,
                    searchTransparencyLayer,
                    drawLayer,
                    textLayer,
                    {height, width},
                    (): Point => {
                        const pageView: PageView = viewer.getPageView(it.pageNumber - 1);
                        const pageRects: ClientRect = pageView.svg.getClientRects()[0];
                        return {
                            x: pageRects.left,
                            y: pageRects.top
                        };
                    }
                );

                documentModel.addPage(page);
            });


        return pdfDocument;
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

    get currentPageNumber(): number {
        return this.viewer.currentPageNumber;
    }

    set currentPageNumber(currentPageNumber: number) {
        this.viewer.currentPageNumber = currentPageNumber;
    }

    get scale(): number {
        return this.viewer.currentScale;
    }

    set scale(scale: number) {
        this.viewer.currentScale = scale;
    }

    constructor(
        private readonly viewer: PDFViewer,
        readonly highlighting: Highlighting,
        readonly toolbox: Toolbox
    ) {

        this.pageChange = new Observable((subscriber: Subscriber<PageChangingEvent>): TeardownLogic => {
            this.viewer.eventBus.on("pagechanging", (evt) => subscriber.next(evt));
        })
            .pipe(map((it) => new PageChangeEvent(it.pageNumber)));

        this.pageCount = this.viewer.pdfDocument.pdfInfo.numpages;
    }

    getOutline(): Promise<Outline> {
        throw new Error("Not implemented yet");
    }

    getThumbnails(...pageNumbers: Array<number>): Observable<PageThumbnail> {
        throw new Error("Not implemented yet" + pageNumbers);
    }
}

function createLayerDiv(height: number, width: number): HTMLDivElement {

    const div: HTMLElementTagNameMap["div"] = window.document.createElement("div");
    div.setAttribute("style", `width: ${width}px; height: ${height}px`);
    div.classList.add("page-layer");

    return div;
}
