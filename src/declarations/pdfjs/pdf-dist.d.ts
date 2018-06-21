// pdfjs-dist - https://github.com/mozilla/pdf.js/
// This declarations is not complete and will only include declarations needed for this library to work.
declare module "pdfjs-dist" {

    export class GlobalWorkerOptions {
        static workerSrc: string;
    }

    export interface BaseSource {
        MapUrl: string;
        cMapPacked: boolean;
    }

    export interface URLSource extends BaseSource {
        url: string;
    }

    export interface DataSource extends BaseSource {
        data: ArrayBuffer;
    }

    export type Source = string | ArrayBuffer | URLSource | DataSource;

    export function getDocument(src: Source): Promise<PDFDocumentProxy>;

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

    export class PDFDocumentProxy {
        readonly pdfInfo: PDFInfo;
        readonly numPages: number;

        getOutline(): Promise<PDFOutline>;

        getDestination(dest: DestType): Promise<OutlineDestination>;

        getPageIndex(ref: PageRef): Promise<number>;
    }
}
