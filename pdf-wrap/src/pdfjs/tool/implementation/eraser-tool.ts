import { combineLatest, merge, Observable, of, Subject } from "rxjs";
import { exhaustMap, filter, map, mapTo, pairwise, switchMap, takeUntil, tap } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { DrawElement, PolyLine } from "../../../api/draw";
import { DrawEvent, PageLayer } from "../../../api/storage";
import { Eraser } from "../../../api/tool";
import { LoggerFactory } from "../../../log-config";
import { CanvasElement } from "../../../paint/canvas.elements";
import { ClientLine, ClientPolyline } from "../../client-line";
import { DocumentModel } from "../../document.model";
import { DrawingTool } from "../tool.basic";

/**
 * Allows to erase elements on a canvas by crossing it with the mouse
 * while the mouse is pressed.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.2
 * @internal
 */
export class EraserTool extends DrawingTool implements Eraser {

    private readonly afterElementRemovedEvent: Subject<DrawEvent<DrawElement>> = new Subject<DrawEvent<DrawElement>>();
    private readonly dispose$: Subject<void> = new Subject<void>();
    readonly afterElementRemoved: Observable<DrawEvent<DrawElement>> = this.afterElementRemovedEvent.asObservable();

    protected readonly onFinish: Observable<void>;

    private readonly eraserLog: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/tools:EraserTool");

    constructor(
        document: DocumentModel
    ) {
        super(document);

        this.stateChange.subscribe((it) => {
            if(it.isActive) {
                this.listenToChanges();
            } else {
                this.stopListenToChanges();
            }
        });

        // use our after element removed observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.stateChange.pipe(filter((it) => !it.isActive), mapTo(undefined));
    }

    private listenToChanges(): void {
        // Fetch all polylines from the selected page.
        const downEvent: Observable<Array<[string, ClientPolyline]>> = of(undefined).pipe(
            map(() => (
                this.page.drawLayer.select("polyline.drawing")
                    .map((it) => it.transform() as PolyLine)
                    .map((it): [string, ClientPolyline] =>
                        [
                            it.id,
                            new ClientPolyline(
                                it.coordinates
                            )
                        ]
                    )
            ))
        );

        // Calculate lines pairwise from mouse movement.
        const moveEvent: Observable<ClientLine> = merge(this.touchMove, this.mouseMove)
            .pipe(
                filter((it) => ("touches" in it) ? it.touches.length === 1 : true),
                map((it) => this.calcRelativePosition(it)),
                pairwise(),
                map((it) => new ClientLine(it[0], it[1]))
            );

        // Collision detection, until mouse up event fires.
        const upEvent: Observable<[ClientLine, Array<[string, ClientPolyline]>]> = downEvent.pipe(
            exhaustMap((it) => combineLatest([moveEvent, of(it)])),
            map((it): [ClientLine, Array<[string, ClientPolyline]>] => [it[0], it[1]]),
            tap((it) => {
                const touchMoveLine: ClientLine = it[0];
                for (const [polylineId, polyline] of it[1]) {
                    if (polyline.intersectsWith(touchMoveLine)) {
                        const elements: Array<CanvasElement<DrawElement>> = this.page.drawLayer.select(`#${polylineId}`);

                        if (elements.length > 0) {

                            const element: CanvasElement<DrawElement> = elements[0];
                            const drawEvent: DrawEvent<DrawElement> = new DrawEvent(
                                element.transform(),
                                this.page.pageNumber,
                                PageLayer.DRAWING
                            );

                            this.eraserLog.debug(() => `Eraser moved over ${drawEvent.element.id}`);

                            this.afterElementRemovedEvent.next(drawEvent);

                            element.remove();
                        }
                    }
                }
            }),
            takeUntil(merge(this.mouseUp, this.touchEnd)),
            takeUntil(this.dispose$)
        );

        // Start collision detection on mouse down.
        merge(this.touchStart, this.mouseDown).pipe(
            switchMap(() => upEvent),
            takeUntil(this.dispose$)
        ).subscribe();
    }

    private stopListenToChanges(): void {
        this.dispose$.next();
    }
}
