import {Canvas} from "../paint/painters";
import {Dimension, Point} from "../api/draw/draw.basic";

/**
 * Holds information about a PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class DocumentModel {

    private readonly pages: Map<number, Page> = new Map();

    constructor(
        readonly viewer: HTMLElement
    ) {}

    addPage(page: Page): void {
        this.pages.set(page.pageNumber, page);
    }

    /**
     * @param {number} pageNumber - the page number of the wanted page
     *
     * @returns {Page} the found page
     * @throws {Error} if no page matching the given {@code pageNumber} could be found
     */
    getPage(pageNumber: number): Page {

        const page: Page | undefined = this.pages.get(pageNumber);

        if (page !== undefined) {
            return page;
        }

        throw Error(`No such page exists: pageNumber=${pageNumber}`);
    }
}

/**
 * Holds all the layers of a single PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class Page {

    get pagePosition(): Point {
        return this.pagePositionSupplier();
    }

    constructor(
        readonly pageNumber: number,
        readonly container: HTMLElement,
        readonly highlightLayer: Canvas,
        readonly searchLayer: Canvas,
        readonly pdfLayer: HTMLDivElement,
        readonly highlightLayerTransparency: Canvas,
        readonly searchLayerTransparency: Canvas,
        readonly drawLayer: Canvas,
        readonly textLayer: HTMLDivElement,
        readonly pageDimension: Dimension,
        private readonly pagePositionSupplier: () => Point
    ) {}
}

/**
 * Attempts to read the page number of the clicked page.
 * If no page number could be found, undefined will be returned.
 *
 * @param {Event} evt - the event used for the coordinates
 *
 * @returns {number | undefined} the page number if found, otherwise undefined
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export function getPageNumberByEvent(evt: Event): number | undefined {

    const dataPageNumber: string | undefined = (evt.target as Element)!.parentElement!.parentElement!.dataset.pageNumber
        || (evt.target as Element)!.parentElement!.dataset.pageNumber || undefined;

    if (dataPageNumber !== undefined) {
        return parseInt(dataPageNumber!, 10);
    }

    return undefined;
}
