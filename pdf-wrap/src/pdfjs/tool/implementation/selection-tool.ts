import { fromEvent, merge, Observable, Subject } from "rxjs";
import { filter, map, takeUntil, tap, throttleTime } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { BorderElement, Circle, DrawElement, Ellipse, Form, Line, PolyLine, Rectangle } from "../../../api/draw";
import { SelectionChangeEvent, StateChangeEvent } from "../../../api/event";
import { DrawEvent, PageLayer } from "../../../api/storage";
import { FormsTool, Selection } from "../../../api/tool";
import { LoggerFactory } from "../../../log-config";
import {
    CanvasBorderElement,
    CanvasCircle,
    CanvasElement,
    CanvasEllipse,
    CanvasFormElement,
    CanvasLine,
    CanvasPolyLine,
    CanvasRectangle
} from "../../../paint/canvas.elements";
import { DocumentModel, Page, PageVisibilityChangeEvent } from "../../document.model";
import {
    CircleRescaleStrategy,
    EllipseRescaleStrategy,
    LineRescaleStrategy,
    PolyLineRescaleStrategy,
    RectangleRescaleStrategy,
    RescaleManager,
    RescaleStrategy
} from "../../rescale-manager";
import { BorderElementSelection, Disposable, FormElementSelection, ToolElementSelection } from "../../selection";
import { BaseTool } from "../tool.basic";

export class SelectionTool extends BaseTool implements Selection {

    readonly onElementSelection: Observable<SelectionChangeEvent>;
    readonly onElementRemoved: Observable<DrawEvent<DrawElement>>;
    readonly afterRectangleModified: Observable<DrawEvent<Rectangle>>;
    readonly afterEllipseModified: Observable<DrawEvent<Ellipse>>;
    readonly afterCircleModified: Observable<DrawEvent<Circle>>;
    readonly afterLineModified: Observable<DrawEvent<Line>>;
    readonly afterPolyLineModified: Observable<DrawEvent<PolyLine>>;

    private selection: ToolElementSelection | null = null;
    private readonly _onElementSelection: Subject<SelectionChangeEvent> = new Subject();
    private readonly _onElementRemoved: Subject<DrawEvent<DrawElement>> = new Subject();
    private readonly _afterRectangleModified: Subject<DrawEvent<Rectangle>> = new Subject();
    private readonly _afterEllipseModified: Subject<DrawEvent<Ellipse>> = new Subject();
    private readonly _afterCircleModified: Subject<DrawEvent<Circle>> = new Subject();
    private readonly _afterLineModified: Subject<DrawEvent<Line>> = new Subject();
    private readonly _afterPolyLineModified: Subject<DrawEvent<PolyLine>> = new Subject();

    private readonly selectionLog: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/tools:SelectionTool");

    constructor(
        private readonly model: DocumentModel,
        private readonly forms: FormsTool,
        private readonly rescaleManager: RescaleManager,
    ) {
        super();
        this.onElementSelection = this._onElementSelection.asObservable();
        this.onElementRemoved = this._onElementRemoved.asObservable();
        this.afterRectangleModified = this._afterRectangleModified.asObservable();
        this.afterEllipseModified = this._afterEllipseModified.asObservable();
        this.afterCircleModified = this._afterCircleModified.asObservable();
        this.afterLineModified = this._afterLineModified.asObservable();
        this.afterPolyLineModified = this._afterPolyLineModified.asObservable();

        // Listen on tool state change events
        this.stateChange
            .pipe(filter((event) => event.isActive)) // Only attach listener if tool state is changing to active.
            .subscribe(() => {

                this.model.visiblePages.forEach((page) => {
                    this.attachListenersToPage(page);
                });

                this.forms.line.afterPaintCompleted
                    .pipe(takeUntil(this.stateChange))
                    .subscribe((event) => {
                        const element: CanvasLine = this.getCanvasElementByEvent(event);

                        this.attachListenerToLine(this.model.getPage(event.pageNumber), element);
                    });

                this.forms.rectangle.afterPaintCompleted
                    .pipe(takeUntil(this.stateChange))
                    .subscribe((event) => {
                        const element: CanvasRectangle = this.getCanvasElementByEvent(event);
                        this.attachListenerToRectangle(this.model.getPage(event.pageNumber), element);
                    });

                this.forms.ellipse.afterPaintCompleted
                    .pipe(takeUntil(this.stateChange))
                    .subscribe((event) => {
                        const element: CanvasEllipse = this.getCanvasElementByEvent(event);
                        this.attachListenerToEllipse(this.model.getPage(event.pageNumber), element);
                    });

                this.forms.circle.afterPaintCompleted
                    .pipe(takeUntil(this.stateChange))
                    .subscribe((event) => {
                        const element: CanvasCircle = this.getCanvasElementByEvent(event);
                        this.attachListenerToCircle(this.model.getPage(event.pageNumber), element);
                    });

                // Listen to page changes as long as the tool is active.
                this.model.onPageVisibilityChange
                    .pipe(takeUntil(this.stateChange))
                    .subscribe({
                        complete: (): void => this.clearSelection(),
                        next: (event: PageVisibilityChangeEvent): void => {
                            if (event.visible) {
                                this.attachListenersToPage(event.page);
                            }
                        }
                    });
            });
    }

    private attachListenersToPage(page: Page): void {

        // Listen to interactions with the page to deselect forms.
        merge(
            fromEvent(page.container, "mousedown"),
            fromEvent(page.container, "touchstart"),
            fromEvent(page.container, "pointerdown"),
        )
            .pipe(
                filter((it) => !this.isFormInteraction(it)),
                takeUntil(this.pageNoLongerVisibleListener(page)),
                takeUntil(this.toolNoLongerActive())
            )
            .subscribe(() => this.clearSelection());

        page.drawLayer.select("line.drawing").forEach((it) => {
            this.attachListenerToLine(page, it as CanvasLine);
        });

        page.drawLayer.select("polyline.drawing").forEach((it) => {
            this.attachListenerToPolyLine(page, it as CanvasPolyLine);
        });

        page.drawLayer.select("rect.drawing").forEach((it) => {
            this.attachListenerToRectangle(page, it as CanvasRectangle);
        });

        page.drawLayer.select("ellipse.drawing").forEach((it) => {
            this.attachListenerToEllipse(page, it as CanvasEllipse);
        });

        page.drawLayer.select("circle.drawing").forEach((it) => {
            this.attachListenerToCircle(page, it as CanvasCircle);
        });
    }

    private getCanvasElementByEvent<R extends DrawElement, T extends CanvasBorderElement<R>>(event: DrawEvent<R>): T {
        return this.model
            .getPage(event.pageNumber)
            .drawLayer
            .select(`#${event.element.id}`)
            .reduce((previous, current) => (current || previous)) as T;
    }

    private pageNoLongerVisibleListener(page: Page): Observable<PageVisibilityChangeEvent> {
        return this.model.onPageVisibilityChange
            .pipe(
                filter((event) => event.page === page && !event.visible)
            );
    }

    private toolNoLongerActive(): Observable<StateChangeEvent> {
        return this.stateChange.pipe(filter((event) => !event.isActive));
    }

    private attachListenerToBorderElement<R extends BorderElement, T extends CanvasBorderElement<R>>(
        page: Page,
        element: CanvasElement<DrawElement>,
        rescaleStrategy: RescaleStrategy<R>
    ):
        Observable<BorderElementSelection<R, T>> {
        const clickEvents: Observable<MouseEvent> = element.on("mousedown");
        const pointerEvents: Observable<PointerEvent> = element.on("pointerdown");
        const touchEvents: Observable<TouchEvent> = element.on("touchstart");

        const elementId: string = element.transform().id;

        return merge(
            clickEvents.pipe(map(() => element as T)),
            touchEvents.pipe(map(() => element as T)),
            pointerEvents.pipe(map(() => element as T))
        )
            .pipe(
                filter((_) => !this.selection || this.selection.selectionId !== elementId),
                throttleTime(100),
                tap(this.clearSelection.bind(this)),
                tap((it) => {
                    it.selected = true;
                    it.draggable = true;
                    it.resizable = true;
                }),
                tap(() => this.selectionLog.trace(`Selection change occurred.`)),
                map((it) => new BorderElementSelection<R, T>(page, it, rescaleStrategy)),
                takeUntil(this.toolNoLongerActive()),
                takeUntil(this.pageNoLongerVisibleListener(page))
            );
    }

    private attachListenerToFormElement
    <R extends Form, T extends CanvasFormElement<R>>(
        page: Page,
        element: CanvasElement<DrawElement>,
        rescaleStrategy: RescaleStrategy<R>
    ): Observable<FormElementSelection<R, T>> {
        const clickEvents: Observable<MouseEvent> = element.on("mousedown");
        const pointerEvents: Observable<PointerEvent> = element.on("pointerdown");
        const touchEvents: Observable<TouchEvent> = element.on("touchstart");

        const elementId: string = element.transform().id;

        return merge(
            clickEvents.pipe(map(() => element as T)),
            touchEvents.pipe(map(() => element as T)),
            pointerEvents.pipe(map(() => element as T))
        )
            .pipe(
                filter((_) => !this.selection || this.selection.selectionId !== elementId),
                throttleTime(100),
                tap(this.clearSelection.bind(this)),
                tap((it) => {
                    it.selected = true;
                    it.draggable = true;
                    it.resizable = true;
                }),
                tap(() => this.selectionLog.trace(`Selection change occurred.`)),
                map((it) => new FormElementSelection<R, T>(page, it, rescaleStrategy)),
                takeUntil(this.toolNoLongerActive()),
                takeUntil(this.pageNoLongerVisibleListener(page))
            );
    }

    private attachListenerToLine(page: Page, element: CanvasLine): void {
        this.attachListenerToBorderElement<Line, CanvasLine>(page, element, new LineRescaleStrategy(this.rescaleManager))
            .pipe(
                tap((it) => it.afterElementRemoved.subscribe({
                    complete: (): void => this.clearSelection(),
                    next: (rEvent: DrawElement): void => this._onElementRemoved.next(new DrawEvent(rEvent, page.pageNumber, PageLayer.DRAWING))
                })),
                tap((it) => it.afterElementModified.subscribe(
                    (mEvent) => this._afterLineModified.next(new DrawEvent(mEvent, page.pageNumber, PageLayer.DRAWING)))
                ),
                tap((it) => it.afterPositionChange.subscribe(() => this.reemitElementsOfPage(page)))
            ).subscribe((it) => {
            this._onElementSelection.next(new SelectionChangeEvent(true, it));
            this.selection = it;
            this.selectionLog.trace("Store new selection.");
        });
    }

    private attachListenerToPolyLine(page: Page, element: CanvasPolyLine): void {
        this.attachListenerToBorderElement<PolyLine, CanvasPolyLine>(page, element, new PolyLineRescaleStrategy(this.rescaleManager))
            .pipe(
                tap((it) => it.afterElementRemoved.subscribe({
                    complete: (): void => this.clearSelection(),
                    next: (rEvent): void => this._onElementRemoved.next(new DrawEvent(rEvent, page.pageNumber, PageLayer.DRAWING))
                })),
                tap((it) => it.afterElementModified.subscribe(
                    (mEvent) => this._afterPolyLineModified.next(new DrawEvent(mEvent, page.pageNumber, PageLayer.DRAWING)))
                ),
                tap((it) => it.afterPositionChange.subscribe(() => this.reemitElementsOfPage(page)))
            ).subscribe((it) => {
            this._onElementSelection.next(new SelectionChangeEvent(true, it));
            this.selection = it;
            this.selectionLog.trace("Store new selection.");
        });
    }

    private attachListenerToRectangle(page: Page, element: CanvasRectangle): void {
        this.attachListenerToFormElement<Rectangle, CanvasRectangle>(page, element, new RectangleRescaleStrategy(this.rescaleManager))
            .pipe(
                tap((it) => it.afterElementRemoved.subscribe({
                    complete: (): void => this.clearSelection(),
                    next: (rEvent: DrawElement): void => this._onElementRemoved.next(new DrawEvent(rEvent, page.pageNumber, PageLayer.DRAWING))
                })),
                tap((it) => it.afterElementModified.subscribe(
                    (mEvent) => this._afterRectangleModified.next(new DrawEvent(mEvent, page.pageNumber, PageLayer.DRAWING)))
                ),
                tap((it) => it.afterPositionChange.subscribe(() => this.reemitElementsOfPage(page)))
            ).subscribe((it) => {
            this._onElementSelection.next(new SelectionChangeEvent(true, it));
            this.selection = it;
            this.selectionLog.trace("Store new selection.");
        });
    }

    private attachListenerToEllipse(page: Page, element: CanvasEllipse): void {
        this.attachListenerToFormElement<Ellipse, CanvasEllipse>(page, element, new EllipseRescaleStrategy(this.rescaleManager))
            .pipe(
                tap((it) => it.afterElementRemoved.subscribe({
                    complete: (): void => this.clearSelection(),
                    next: (rEvent: DrawElement): void => this._onElementRemoved.next(new DrawEvent(rEvent, page.pageNumber, PageLayer.DRAWING))
                })),
                tap((it) => it.afterElementModified.subscribe(
                    (mEvent) => this._afterEllipseModified.next(new DrawEvent(mEvent, page.pageNumber, PageLayer.DRAWING)))
                ),
                tap((it) => it.afterPositionChange.subscribe(() => this.reemitElementsOfPage(page)))
            ).subscribe((it) => {
            this._onElementSelection.next(new SelectionChangeEvent(true, it));
            this.selection = it;
            this.selectionLog.trace("Store new selection.");
        });
    }

    private attachListenerToCircle(page: Page, element: CanvasCircle): void {
        this.attachListenerToFormElement<Circle, CanvasCircle>(page, element, new CircleRescaleStrategy(this.rescaleManager))
            .pipe(
                tap((it) => it.afterElementRemoved.subscribe({
                    complete: (): void => this.clearSelection(),
                    next: (rEvent: DrawElement): void => this._onElementRemoved.next(new DrawEvent(rEvent, page.pageNumber, PageLayer.DRAWING)),
                })),
                tap((it) => it.afterElementModified.subscribe(
                    (mEvent) => this._afterCircleModified.next(new DrawEvent(mEvent, page.pageNumber, PageLayer.DRAWING)))
                ),
                tap((it) => it.afterPositionChange.subscribe(() => this.reemitElementsOfPage(page)))
            ).subscribe((it) => {
            this._onElementSelection.next(new SelectionChangeEvent(true, it));
            this.selection = it;
            this.selectionLog.trace("Store new selection.");
        });
    }

    private reemitElementsOfPage(page: Page): void {
        page.drawLayer.select("line.drawing").forEach((it) => {
            const line: Line = it.transform() as Line;
            const event: DrawEvent<Line> = new DrawEvent(line, page.pageNumber, PageLayer.DRAWING);
            this._onElementRemoved.next(event);
            this._afterLineModified.next(event);
        });

        page.drawLayer.select("rect.drawing").forEach((it) => {
            const rectangle: Rectangle = it.transform() as Rectangle;
            const event: DrawEvent<Rectangle> = new DrawEvent(rectangle, page.pageNumber, PageLayer.DRAWING);
            this._onElementRemoved.next(event);
            this._afterRectangleModified.next(event);
        });

        page.drawLayer.select("polyline.drawing").forEach((it) => {
            const polyLine: PolyLine = it.transform() as PolyLine;
            const event: DrawEvent<PolyLine> = new DrawEvent(polyLine, page.pageNumber, PageLayer.DRAWING);
            this._onElementRemoved.next(event);
            this._afterPolyLineModified.next(event);
        });

        page.drawLayer.select("circle.drawing").forEach((it) => {
            const circle: Circle = it.transform() as Circle;
            const event: DrawEvent<Circle> = new DrawEvent(circle, page.pageNumber, PageLayer.DRAWING);
            this._onElementRemoved.next(event);
            this._afterCircleModified.next(event);
        });

        page.drawLayer.select("ellipse.drawing").forEach((it) => {
            const ellipse: Ellipse = it.transform() as Ellipse;
            const event: DrawEvent<Ellipse> = new DrawEvent(ellipse, page.pageNumber, PageLayer.DRAWING);
            this._onElementRemoved.next(event);
            this._afterEllipseModified.next(event);
        });
    }

    private clearSelection(): void {
        if (this.selection !== null) {
            const selection: Disposable = this.selection;
            this.selection = null;

            this.selectionLog.trace("Dispose current selection.");
            this._onElementSelection.next(new SelectionChangeEvent(false));
            if (!selection.isDisposed) {
                selection.dispose();
            }
        }
    }

    private isFormInteraction(event: Event): boolean {
        if (!event.target) {
            return false;
        }

        const element: Element = event.target as Element;
        if (!element.parentElement) {
            return false;
        }

        return this.isSVGChild(element);
    }

    private isSVGChild(node: Node): boolean {
        if (node.parentElement === null) {
            return false;
        }
        if (node.parentElement.localName !== "svg") {
            return this.isSVGChild(node.parentElement);
        }

        return true;
    }
}
