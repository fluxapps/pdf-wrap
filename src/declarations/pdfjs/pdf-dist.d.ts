// pdfjs-dist - https://github.com/mozilla/pdf.js/
// This declarations is not complete and will only include declarations needed for this library to work.
declare module "pdfjs-dist" {

    import { PDFDocumentLoadingTask } from "pdfjs-dist/lib/display/api";

    export class GlobalWorkerOptions {
        static workerSrc: string;
    }

    export interface BaseSource {
        cMapUrl: string;
        cMapPacked: boolean;
        maxImageSize: number;
    }

    export interface URLSource extends BaseSource {
        url: string;
    }

    export interface DataSource extends BaseSource {
        data: ArrayBuffer;
    }

    export type Source = string | ArrayBuffer | URLSource | DataSource;

    export function getDocument(src: Source): PDFDocumentLoadingTask;

    export interface PDFInfo {
        readonly numPages: number;
    }

    export interface PageRef {}

    export interface OutlineDestination extends ArrayLike<PageRef> {}

    export interface DestType {}

    export interface PDFOutlineItem {
        readonly dest: DestType;
        readonly title: string;
        readonly items: PDFOutline;
    }

    export interface PDFOutline extends ArrayLike<PDFOutlineItem> {}

    export interface PageViewPort {
        readonly width: number;
        readonly height: number;
    }

    export interface PageRenderOptions {
        canvasContext: CanvasRenderingContext2D;
        viewport: PageViewPort;
    }

    export interface PDFPageProxy {

        readonly pageNumber: number;

        getViewport(options: GetViewPortOptions): PageViewPort;

        render(opt: PageRenderOptions): Promise<void>;
    }

    export interface GetViewPortOptions {
        scale: number;
    }

    export class PDFDocumentProxy {
        readonly pdfInfo: PDFInfo;
        readonly numPages: number;

        getOutline(): Promise<PDFOutline>;

        getDestination(dest: DestType): Promise<OutlineDestination>;

        getPageIndex(ref: PageRef): Promise<number>;

        getPage(pageNumber: number): Promise<PDFPageProxy>;

        /**
         * Cleans up resources allocated by the document, e.g. created `@font-face`.
         */
        cleanup(): void;

        /**
         * Destroys the current document instance and terminates the worker.
         */
        destroy(): Promise<void>;
    }
}
