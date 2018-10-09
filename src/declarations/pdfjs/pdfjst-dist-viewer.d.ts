
declare module "pdfjs-dist/web/pdf_viewer" {

    import {PDFDocumentProxy} from "pdfjs-dist";

    export interface PageChangingEvent {
        pageNumber: number;
    }

    export interface PagesInitializedEvent {}

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
        on(evt: "pagesinit", callback: (evt: PagesInitializedEvent) => void): void;

        off(evt: "pagerendered", callback: (evt: PageRenderedEvent) => void): void;
        off(evt: "pagechanging", callback: (evt: PageChangingEvent) => void): void;
        off(evt: "pagesinit", callback: (evt: PagesInitializedEvent) => void): void;

        dispatch(eventName: string, ...args?: unknown): void;
    }

    export interface ViewerOptions {
        container: HTMLElement;
        eventBus: EventBus;
        renderer: "svg" | "canvas";
    }

    export interface PageView {
        readonly svg: HTMLElement;
        readonly canvas: HTMLCanvasElement;
    }

    export class PDFViewer {

        readonly pdfDocument: PDFDocumentProxy;
        readonly eventBus: EventBus;
        currentScale: number;
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
