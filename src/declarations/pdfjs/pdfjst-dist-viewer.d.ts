declare module "pdfjs-dist/web/pdf_viewer" {

    import {PDFDocumentProxy} from "pdfjs-dist";

    export interface PageChangingEvent {
        pageNumber: number;
    }

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
    }

    export interface ViewerOptions {
        container: HTMLElement;
        eventBus: EventBus;
        renderer: "svg" | "canvas";
    }

    export interface PageView {
        readonly svg: HTMLElement;
    }

    export class PDFViewer {

        readonly pdfDocument: PDFDocumentProxy;
        readonly eventBus: EventBus;
        currentScale: number;
        currentPageNumber: number;

        constructor(options: ViewerOptions);

        setDocument(pdf: PDFDocumentProxy): void;

        getPageView(pageIndex: number): PageView;
    }
}
