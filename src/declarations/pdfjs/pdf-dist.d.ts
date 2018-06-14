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
        readonly numpages: number;
    }

    export class PDFDocumentProxy {
        readonly pdfInfo: PDFInfo;
    }
}
