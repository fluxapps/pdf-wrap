declare module "pdfjs-dist/web/pdf_viewer" {

    import {PDFDocumentProxy} from "pdfjs-dist";
    import { PDFRenderingQueue } from "pdfjs-dist/lib/web/pdf_rendering_queue";
    import {PDFDocument, ScalePreset} from "../../api/document";

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

        setDocument(pdfDocument: PDFDocument | null, baseUrl?: string = null): void;

        setViewer(pdfViewer: PDFViewer | null): void;

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
        linkService: PDFLinkService;
        findController: PDFFindController;
        removePageBorders: boolean;
        textLayerMode: TextLayerMode;
        renderInteractiveForms: boolean;
        renderingQueue?: pdfRenderingQueue;
        enablePrintAutoRotate: boolean;
        renderer: RenderingType;
        enableWebGL: boolean;
        useOnlyCssZoom: boolean;
        maxCanvasPixels?: number;
    }

    export interface PageView {
        readonly svg: HTMLElement;
        readonly canvas: HTMLCanvasElement;
    }

    export class PDFViewer {

        readonly pdfDocument: PDFDocumentProxy;
        readonly eventBus: EventBus;
        readonly renderer: RenderingType;
        readonly renderingQueue: PDFRenderingQueue;
        readonly linkService: PDFLinkService;
        readonly findController: PDFFindController;
        currentScale: number;
        currentScaleValue: number | ScalePreset;
        currentPageNumber: number;

        constructor(options: ViewerOptions);

        setDocument(pdf: PDFDocumentProxy | null): void;

        getPageView(pageIndex: number): PageView;

        setFindController(controller: PDFFindController): void;
        update(): void;

        cleanup(): void;
    }

    export interface FindControllerOptions {
        linkService: PDFLinkService;
        eventBus: EventBus;
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
        _reset(): void;
    }
}

declare module "pdfjs-dist/lib/web/pdf_rendering_queue" {
    import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
    export class PDFRenderingQueue {
        pdfThumbnailViewer: PDFThumbnailViewer | null;
        onIdle: (() => void) | null;
        idleTimeout: number | null;
        printing: boolean;
        isThumbnailViewEnabled: boolean;

        setViewer(viewer: PDFViewer | null): void;
        renderHighestPriority(): void;
    }
}

declare module "pdfjs-dist/lib/display/api" {
    import { PDFDocumentProxy } from "pdfjs-dist";

    export class PDFDocumentLoadingTask {
        get promise(): Promise<PDFDocumentProxy>;
    }
}
