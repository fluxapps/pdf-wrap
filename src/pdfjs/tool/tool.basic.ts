import {Tool} from "../../api/tool/toolbox";
import {StateChangeEvent} from "../../api/event/event.api";
import {Observable} from "rxjs/internal/Observable";
import {DocumentModel, getPageNumberByEvent, Page} from "../document.model";
import {Point} from "../../api/draw/draw.basic";
import {delayWhen, filter, share, tap} from "rxjs/operators";
import {Subject} from "rxjs/internal/Subject";
import {fromEvent} from "rxjs/internal/observable/fromEvent";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../../log-config";

/**
 * Implements the basic features of a tool.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
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

    private readonly stateChangeEvent: Subject<StateChangeEvent> = new Subject();

    protected constructor() {
        this.stateChange = this.stateChangeEvent.asObservable().pipe(share());
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
        this.stateChangeEvent!.next(new StateChangeEvent(this._isActive));
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
        protected readonly document: DocumentModel
    ) {
        super();

        this.mouseDown = fromEvent<MouseEvent>(document.viewer, "mousedown")
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => this.setPageByEvent(it)))
            .pipe(tap((_) => this.log.trace(() => `Mouse down event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.mouseMove = fromEvent<MouseEvent>(document.viewer, "mousemove")
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => this.log.trace(() => `Mouse move event from drawing tool: tool=${this.constructor.name}`)))
            .pipe(share());

        this.mouseUp = fromEvent<MouseEvent>(document.viewer, "mouseup")
            .pipe(filter(() => this.hasPage))
            .pipe(tap((_) => {
                this.log.trace(() => `Mouse up event from drawing tool: tool=${this.constructor.name}`);
            }))
            .pipe(share());

        // We use our mouse up observable and delay it until the onFinish observable emits
        this.mouseUp
            .pipe(delayWhen((_) => this.onFinish))
            .subscribe(() => {
                this._page = undefined;
            });
    }

    /**
     * Calculates the relative positions to the current page.
     *
     * @param {MouseEvent} evt - the event to calculate against the page
     *
     * @returns {Point} the relative coordinates
     */
    protected calcRelativePosition(evt: MouseEvent): Point {
        return {
            x: evt.clientX - this.page.pagePosition.x,
            y: evt.clientY - this.page.pagePosition.y
        };
    }

    private setPageByEvent(evt: Event): void {

        this.log.trace(() => `Try to get a page number by an event: event=${evt.type}`);

        const pageNumber: number | undefined = getPageNumberByEvent(evt);

        this._page = (pageNumber !== undefined) ? this.document.getPage(pageNumber) : undefined;
    }
}
