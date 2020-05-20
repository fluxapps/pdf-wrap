import { combineLatest, merge, Observable, of, Subscriber, TeardownLogic } from "rxjs";
import { exhaustMap, map, pairwise, share, switchMap, takeUntil, tap } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { DrawElement, PolyLine } from "../../../api/draw/elements";
import { DrawEvent, PageLayer } from "../../../api/storage/page.event";
import { Eraser } from "../../../api/tool/toolbox";
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
 * @since 0.0.1
 * @internal
 */
export class EraserTool extends DrawingTool implements Eraser {

    readonly afterElementRemoved: Observable<DrawEvent<DrawElement>>;

    protected readonly onFinish: Observable<void>;

    private readonly eraserLog: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/tools:EraserTool");

    constructor(
        document: DocumentModel
    ) {
        super(document);

        this.afterElementRemoved = new Observable((subscriber: Subscriber<DrawEvent<DrawElement>>): TeardownLogic => {

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

                                subscriber.next(drawEvent);

                                element.remove();
                            }
                        }
                    }
                }),
                takeUntil(merge(this.mouseUp, this.touchEnd))
            );

            // Start collision detection on mouse down.
            merge(this.touchStart, this.mouseDown).pipe(
                switchMap(() => upEvent),
            ).subscribe();

        }).pipe(share());

        // use our after element removed observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.afterElementRemoved.pipe(map((_) => {/* return void */
        }));
    }
}
