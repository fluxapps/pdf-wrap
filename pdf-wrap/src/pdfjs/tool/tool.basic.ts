import { fromEvent, merge, Observable, ReplaySubject } from "rxjs";
import { exhaustMap, filter, share, tap } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { Point } from "../../api/draw";
import { StateChangeEvent } from "../../api/event";
import { Tool } from "../../api/tool";
import { LoggerFactory } from "../../log-config";
import { DocumentModel, getPageNumberByEvent, Page } from "../document.model";

/**
 * Implements the basic features of a tool.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.2
 * @internal
 */
export abstract class BaseTool implements Tool {

    /**
     * A hot observable which emits when the state of this tool changes
     * from activated to deactivated or deactivated to activated.
     */
    readonly stateChange: Observable<StateChangeEvent>;

    private readonly logger: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/tool.basic:BaseTool");

    get isActive(): boolean {
        return this._isActive;
    }

    private _isActive: boolean = false;

    private readonly stateChangeEvent: ReplaySubject<StateChangeEvent> = new ReplaySubject(1);

    protected constructor() {
        this.stateChange = this.stateChangeEvent.asObservable();
        this.stateChangeEvent.next(new StateChangeEvent(this._isActive));
    }

    activate(): void {

        this.logger.info(() => `Activate tool: tool=${this.constructor.name}`);

        this._isActive = true;
        this.emit();
    }

    deactivate(): void {

        this.logger.info(() => `Deactivate tool: tool=${this.constructor.name}`);

        this._isActive = false;
        this.emit();
    }

    toggle(): void {
        this._isActive ? this.deactivate() : this.activate();
        this.emit();
    }

    private emit(): void {
        this.stateChangeEvent.next(new StateChangeEvent(this._isActive));
    }
}

/**
 * A drawing tool consumes 3 sequential processes:
 *
 * 1. mousedown
 *    Determines the clicked page. If no page can be determined, every other process will never be consumed.
 *    If a page is already defined, this process will reset itself before continue.
 *
 * 2. mousemove
 *    Will only be consumed, if a page could be determined by the 1. process.
 *
 * 3. mouseup
 *    Will only be consumed, if a page could be determined by the 1. process.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export abstract class DrawingTool extends BaseTool {

    /**
     * @returns {Page} the current clicked page
     * @throws {Error} if no page is available
     */
    protected get page(): Page {
        if (this.hasPage) {
            return this._page!;
        }

        throw new Error("DrawingTool has no page available");
    }

    /**
     * @returns {boolean} true if a page is available, otherwise false
     */
    protected get hasPage(): boolean {
        return this._page !== undefined;
    }

    /**
     * A hot observable which emits on mousedown event.
     */
    protected readonly mouseDown: Observable<MouseEvent>;

    /**
     * A hot observable which emits only a mousemove event, if the mousdown event could be consumed properly.
     */
    protected readonly mouseMove: Observable<MouseEvent>;

    /**
     * A hot observable which emits only a mouseup event, if the mousedown event could be consumed properly.
     */
    protected readonly mouseUp: Observable<MouseEvent>;

    /**
     * A hot observable which emits on touch start event.
     */
    protected readonly touchStart: Observable<TouchEvent>;

    /**
     * A hot observable which emits on touch move event, if the touch start event was able to determine the current page.
     */
    protected readonly touchMove: Observable<TouchEvent>;

    /**
     * A hot observable which emits on touch cancel event, if the touch start event was able to determine the current page.
     */
    protected readonly touchCancel: Observable<TouchEvent>;

    /**
     * A hot observable which emits on touch end event, if the touch start event was able to determine the current page.
     */
    protected readonly touchEnd: Observable<TouchEvent>;

    /**
     * A class extending this class have to implement this observable
     * and emit nothing whenever the extending class is finished
     * with the mousedown, mousemove, mouseup chain.
     *
     * e.g.
     *
     * {@code
     *
     *  class MyDrawingTool extends DrawingTool {
     *
     *      protected readonly onFinish: Observable<void>;
     *
     *      constructor(
     *          document: DocumentModel
     *      ) {
     *          super(document);
     *
     *          this.mousedown.subscribe((it) => { ... });
     *
     *          this.mousemove.subscribe((it) => { ... });
     *
     *          this.onFinish = this.mousup
     *          .pipe(tap((it) => { ... })) // do whatever you have to do
     *          .pipe(map((_) => { }); // map it to void when your finished
     *      }
     *  }
     *
     * }
     */
    protected abstract readonly onFinish: Observable<void>;

    private _page?: Page;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/tool.basic:DrawingTool");

    protected constructor(
        protected readonly document: DocumentModel,
    ) {
        super();

        /*
         * Prevent default to stop the browser from
         * sending the click events as well.
         * See: https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent#Using_with_addEventListener()_and_preventDefault()
         */
        this.touchStart = fromEvent<TouchEvent>(document.viewer, "touchstart")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(tap((it) => this.setPageByEvent(it)))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Touch start event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.touchMove = fromEvent<TouchEvent>(document.viewer, "touchmove")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Touch move event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.touchEnd = fromEvent<TouchEvent>(document.viewer, "touchend")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Touch end event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.touchCancel = fromEvent<TouchEvent>(document.viewer, "touchcancel")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Touch cancel event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.mouseDown = fromEvent<MouseEvent>(document.viewer, "mousedown")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(tap((it) => this.setPageByEvent(it)))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Mouse down event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.mouseMove = fromEvent<MouseEvent>(document.viewer, "mousemove")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Mouse move event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.mouseUp = fromEvent<MouseEvent>(document.viewer, "mouseup")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => it.preventDefault()))
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => {
                this.log.trace(() => `Mouse up event from drawing tool: tool=${this.constructor.name}`);
            }))
            .pipe(share());

        merge(this.mouseDown, this.touchStart, this.touchMove, this.touchCancel, this.touchEnd)
            .pipe(exhaustMap(() => this.onFinish),
                tap((_) => {
                    this.log.trace(() => `On finish fired: tool=${this.constructor.name}`);
                }))
            .subscribe(
                () => {
                    this._page = undefined;
                },
                () => {
                    this._page = undefined;
                    this.log.error(`Unhandled on finish error encountered tool=${this.constructor.name}`);
                },
                () => {
                    this._page = undefined;
                    this.log.error(`Drawing tool complete tool=${this.constructor.name}`);
                }
            );
    }

    /**
     * Calculates the relative positions to the current page.
     *
     * @param {MouseEvent | TouchEvent} evt - the event to calculate against the page
     *
     * @returns {Point} the relative coordinates
     */
    protected calcRelativePosition(evt: MouseEvent | TouchEvent): Point {

        if (evt instanceof TouchEvent) {
            const touch: TouchEvent = evt;
            if (touch.touches.length === 0 && touch.changedTouches.length === 0) {
                return {x: 0, y: 0, z: 0};
            }

            if (touch.changedTouches.length === 0) {
                return {
                    x: touch.touches[0].clientX - this.page.pagePosition.x,
                    y: touch.touches[0].clientY - this.page.pagePosition.y,
                    z: this.page.pagePosition.z
                };
            }

            return {
                x: touch.changedTouches[0].clientX - this.page.pagePosition.x,
                y: touch.changedTouches[0].clientY - this.page.pagePosition.y,
                z: this.page.pagePosition.z
            };
        }

        return {
            x: evt.clientX - this.page.pagePosition.x,
            y: evt.clientY - this.page.pagePosition.y,
            z: this.page.pagePosition.z
        };
    }

    protected isStartEvent(event: Event): boolean {
        return event.type === "touchstart" || event.type === "mousedown";
    }

    protected isMoveEvent(event: Event): boolean {
        return event.type === "touchmove" || event.type === "mousemove";
    }

    protected isEndEvent(event: Event): boolean {
        return event.type === "touchend" || event.type === "touchcancel" || event.type === "mouseup";
    }

    private setPageByEvent(evt: Event): void {

        try {
            this.log.trace(() => `Try to get a page number by an event: event=${evt.type}`);

            const pageNumber: number | undefined = getPageNumberByEvent(evt);

            this._page = (pageNumber !== undefined) ? this.document.getPage(pageNumber) : undefined;
        } catch (e) {
            this.log.info(() => e.message);
        }
    }
}
