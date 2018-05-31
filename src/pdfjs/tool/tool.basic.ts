import {Tool} from "../../api/tool/toolbox";
import {StateChangeEvent} from "../../api/event/event.api";
import {Observable} from "rxjs/internal/Observable";
import {Subscriber} from "rxjs/internal-compatibility";
import {DocumentModel, Page} from "../document.model";
import {Point} from "../../api/draw/draw.basic";
import * as log4js from "@log4js-node/log4js-api";
import {filter, share, tap} from "rxjs/operators";
import {TeardownLogic} from "rxjs/internal/types";

const logger: log4js.Logger = log4js.getLogger("pdf-wrap");

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

    get isActive(): boolean {
        return this._isActive;
    }

    private _isActive: boolean = false; // tslint:disable-line: variable-name

    private stateChangeEvent?: Subscriber<StateChangeEvent>;

    protected constructor() {
        this.stateChange = new Observable((subscriber: Subscriber<StateChangeEvent>): TeardownLogic => {
            this.stateChangeEvent = subscriber;
        }).pipe(share());
    }

    activate(): void {
        this._isActive = true;
        this.emit();
    }

    deactivate(): void {
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
 * 2. mouseover
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
    protected readonly mouseDown: Observable<DocumentEventMap["mousedown"]>;

    /**
     * A hot observable which emits only a mouseover event, if the mousdown event could be consumed properly.
     */
    protected readonly mouseOver: Observable<DocumentEventMap["mouseover"]>;

    /**
     * A hot observable which emits only a mouseup event, if the mousedown event could be consumed properly.
     */
    protected readonly mouseUp: Observable<DocumentEventMap["mouseup"]>;

    private _page?: Page; // tslint:disable-line: variable-name

    protected constructor(
        protected readonly document: DocumentModel
    ) {
        super();

        this.mouseDown = new Observable((subscriber: Subscriber<DocumentEventMap["mousedown"]>): TeardownLogic => {
            this.document.viewer.addEventListener("mousedown", (ev) => subscriber.next(ev));
        })
            .pipe(filter(() => this.isActive))
            .pipe(tap((it) => this.setPageByEvent(it)))
            .pipe(share());

        this.mouseOver = new Observable((subscriber: Subscriber<DocumentEventMap["mouseover"]>): TeardownLogic => {
            this.document.viewer.addEventListener("mouseover", (ev) => subscriber.next(ev));
        })
            .pipe(filter(() => this.hasPage))
            .pipe(tap((it) => logger.trace(`Mouse over event from drawing tool: event=${JSON.stringify(it)}`)))
            .pipe(share());

        this.mouseUp = new Observable((subscriber: Subscriber<DocumentEventMap["mouseup"]>): TeardownLogic => {
            this.document.viewer.addEventListener("mouseup", (ev) => subscriber.next(ev));
        })
            .pipe(filter(() => this.hasPage))
            .pipe(tap((it) => {
                logger.trace(`Mouse up event from drawing tool: event=${JSON.stringify(it)}`);
            }))
            .pipe(share());
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

        logger.trace(`Mouse down event from drawing tool: event=${JSON.stringify(evt)}`);

        const dataPageNumber: string | undefined = evt.srcElement!.parentElement!.parentElement!.dataset.pageNumber
            || evt.srcElement!.parentElement!.dataset.pageNumber || undefined;

        if (dataPageNumber !== undefined) {

            const pageNumber: number = parseInt(dataPageNumber!, 10);
            this._page = this.document.getPage(pageNumber);
        } else {
            this._page = undefined; // make sure no cached page is available
        }
    }
}
