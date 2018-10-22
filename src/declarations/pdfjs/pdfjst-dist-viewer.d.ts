
declare module "pdfjs-dist/web/pdf_viewer" {

    import {PDFDocumentProxy} from "pdfjs-dist";
    import {PDFDocument, ScalePreset} from "../../api/document/pdf.document";

    export interface PageChangingEvent {
        pageNumber: number;
    }

    export interface PagesLoadedEvent {}

    export interface PageViewport {
        readonly height: number;
        readonly width: number;
    }

    export interface PageSource {
        readonly viewport: PageViewport;
        readonly div: HTMLDivElement;
    }

    export interface PageRenderedEvent {
        readonly source: PageSource;
        readonly pageNumber: number;
    }

    export class EventBus {
        on(evt: "pagerendered", callback: (evt: PageRenderedEvent) => void): void;
        on(evt: "pagechanging", callback: (evt: PageChangingEvent) => void): void;
        on(evt: "pagesloaded", callback: (evt: PagesLoadedEvent) => void): void;

        off(evt: "pagerendered", callback: (evt: PageRenderedEvent) => void): void;
        off(evt: "pagechanging", callback: (evt: PageChangingEvent) => void): void;
        off(evt: "pagesloaded", callback: (evt: PagesLoadedEvent) => void): void;

        dispatch(eventName: string, ...args?: unknown): void;
    }

    export class PDFLinkService {
        /**
         * @param {PDFLinkServiceOptions} options
         */
        constructor(options: PDFLinkServiceOptions);

        setDocument(pdfDocument: PDFDocument, baseUrl?: string = null): void;

        setViewer(pdfViewer: PDFViewer): void;

        /**
         * @returns {number}
         */
        get pagesCount(): number;

        /**
         * @returns {number}
         */
        get page(): number;

        /**
         * @param {number} value
         */
        set page(value: number): void;

        /**
         * @returns {number}
         */
        get rotation(): number;

        /**
         * @param {number} value
         */
        set rotation(value: number): void;
    }

    export interface PDFLinkServiceOptions {
        eventBus: EventBus;
        externalLinkTarget?: number;
        externalLinkRel?: string;
    }

    export const enum RenderingType {
        SVG = "svg",
        CANVAS = "canvas"
    }

    export const enum TextLayerMode {
        DISABLE = 0,
        ENABLE = 1,
        ENABLE_ENHANCED = 2
    }

    export interface ViewerOptions {
        container: HTMLElement;
        eventBus: EventBus;
        renderer: RenderingType;
        textLayerMode: TextLayerMode;
        linkService?: PDFLinkService;
        enableWebGL: boolean;
    }

    export interface PageView {
        readonly svg: HTMLElement;
        readonly canvas: HTMLCanvasElement;
    }

    export class PDFViewer {

        readonly pdfDocument: PDFDocumentProxy;
        readonly eventBus: EventBus;
        currentScale: number;
        currentScaleValue: number | ScalePreset;
        currentPageNumber: number;

        constructor(options: ViewerOptions);

        setDocument(pdf: PDFDocumentProxy): void;

        getPageView(pageIndex: number): PageView;

        setFindController(controller: PDFFindController): void;
    }

    export interface FindControllerOptions {
        pdfViewer: PDFViewer;
    }

    export interface PDFSearchOptions {
        readonly query: string;
        readonly phraseSearch: boolean;
        readonly caseSensitive: boolean;
        readonly highlightAll: boolean;
        readonly findPrevious: boolean;
    }

    export type SearchCommand = "find" | "findagain" | "";

    export interface SelectedTerm {
        readonly matchIdx: number;
        readonly pageIdx: number;
    }

    export class PDFFindController {

        readonly selected: SelectedTerm;
        readonly matchCount: number;

        constructor(opt: FindControllerOptions);

        executeCommand(cmd: SearchCommand, options: PDFSearchOptions): void;
    }
}
