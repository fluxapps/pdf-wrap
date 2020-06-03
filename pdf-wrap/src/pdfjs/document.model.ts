import { Observable, Subject } from "rxjs";
import { Logger } from "typescript-logging";
import { Dimension, Point } from "../api/draw";
import { LoggerFactory } from "../log-config";
import { Canvas } from "../paint/painters";

/**
 * Describes a visibility change of a page within the PDF viewer.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class PageVisibilityChangeEvent {
    constructor(readonly visible: boolean, readonly page: Page) {}
}

/**
 * Holds information about a PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class DocumentModel {

    private readonly pages: Map<number, Page> = new Map();
    private readonly elementPageMap: Map<Element, Page> = new Map();
    private readonly pageVisibilityMap: Map<Page, boolean> = new Map();

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/document.model:DocumentModel");
    private readonly intersections: IntersectionObserver;
    private readonly _onPageVisibilityChange: Subject<PageVisibilityChangeEvent> = new Subject();

    // tslint:disable-next-line
    readonly onPageVisibilityChange: Observable<PageVisibilityChangeEvent> = this._onPageVisibilityChange.asObservable();

    private currentPageNumber: number = 0;

    constructor(
        readonly viewer: HTMLElement,
        currentPage$: Observable<number>
    ) {
        currentPage$.subscribe((it) => this.currentPageNumber = it);
        this.intersections = new IntersectionObserver(this.pageIntersectionEventHandler.bind(this), {
            root: viewer,
            rootMargin: "0px",
            threshold: [0, 1]
        });
    }

    /**
     * Returns all currently visible pages.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    get visiblePages(): ReadonlyArray<Page> {
        const visiblePages: Array<Page> = [];
        for (const [page, visible] of this.pageVisibilityMap.entries()) {
            if (visible) {
                visiblePages.push(page);
            }
        }

        return visiblePages;
    }

    /**
     * Adds the given {@code page} to this document model.
     *
     * If a page with the same page number as the given {@code page#pageNumber} exists already,
     * it will be replaced.
     *
     * @param {Page} page - the page to addo
     */
    addPage(page: Page): void {

        this.log.trace(() => `Add page to document model: pageNumber=${page.pageNumber}`);

        // Clean up old page
        const oldPage: Page | undefined = this.pages.get(page.pageNumber);
        if (!!oldPage && this.elementPageMap.has(oldPage.container)) {
            this.intersections.unobserve(oldPage.container);
            this.elementPageMap.delete(oldPage.container);
            this.pageVisibilityMap.delete(oldPage);
            this.log.trace(() => `Page intersection observer detached: pageNumber=${oldPage.pageNumber}`);

            // Page has been discarded and will never show up again, therefore emit visibility false for this page
            // in order to give listener a change to discard events for the old page.
            this.log.trace(`Page intersection event: page=${page.pageNumber} visible=false ratio=0`);
            this._onPageVisibilityChange.next(new PageVisibilityChangeEvent(
                false,
                oldPage
            ));
        }

        this.intersections.observe(page.container);
        this.elementPageMap.set(page.container, page);
        this.log.trace(() => `Page intersection observer attached: pageNumber=${page.pageNumber}`);

        this.pages.set(page.pageNumber, page);
    }

    hasPage(pageNumber: number): boolean {
        return this.pages.get(pageNumber) !== undefined;
    }

    /**
     * @param {number} pageNumber - the page number of the wanted page
     *                              if no page number is given the current page will be returned.
     *
     * @returns {Page} the found page
     * @throws {Error} if no page is matching the given {@code pageNumber}.
     */
    getPage(pageNumber?: number): Page {

        const page: Page | undefined = this.pages.get(pageNumber || this.currentPageNumber);

        if (page !== undefined) {
            return page;
        }

        throw Error(`No such page exists: pageNumber=${pageNumber}`);
    }

    /**
     * Releases all resources.
     * The object must not be used after this method is called.
     *
     * @author Nicolas Schaefli <ns@studer-raimann.ch>
     * @since 0.3.0
     */
    dispose(): void {
        this.intersections.disconnect();
        this.pages.clear();
        this.elementPageMap.clear();
    }

    private pageIntersectionEventHandler(changes: Array<IntersectionObserverEntry>): void {
        changes.forEach((it) => {

            // Do not mess with time critical code and deffer events until the task queue is idle.
            window.requestIdleCallback(() => {
                const page: Page = this.elementPageMap.get(it.target)!;
                const visible: boolean = it.isIntersecting;
                if (visible !== this.pageVisibilityMap.get(page)) {
                    this.log.trace(`Page intersection event: page=${page.pageNumber} visible=${it.isIntersecting} ratio=${it.intersectionRatio}`);
                    this._onPageVisibilityChange.next(new PageVisibilityChangeEvent(
                        visible,
                        page
                    ));

                    this.pageVisibilityMap.set(page, visible);
                }
            });
        });
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
        readonly pdfLayer: HTMLDivElement,
        readonly highlightLayerTransparency: Canvas,
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

    const log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/document.model:getPageNumberByEvent");

    try {

        log.trace(() => `Try to get page number by event: event=${evt.type}`);

        const parentPageElement: Element | null = (evt.target as Element)!.closest(".page");
        const dataPageNumber: string | undefined = parentPageElement !== null ? (parentPageElement as HTMLElement).dataset.pageNumber : undefined;

        if (dataPageNumber !== undefined) {
            log.trace(() => `Found page number by event: event=${evt.type}, pageNumber=${dataPageNumber}`);
            return parseInt(dataPageNumber, 10);
        }

        return undefined;
    } catch (e) {
        log.info(() => e.message);
        return undefined;
    }
}
