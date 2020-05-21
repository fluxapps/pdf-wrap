import { merge, Observable, Subject } from "rxjs";
import { mapTo, takeUntil, tap } from "rxjs/operators";
import { Color, colorFrom, Colors } from "../../../api/draw/color";
import { Point } from "../../../api/draw/draw.basic";
import { PolyLine } from "../../../api/draw/elements";
import { DrawEvent, PageLayer } from "../../../api/storage/page.event";
import { Freehand } from "../../../api/tool/toolbox";
import { PolyLinePainter } from "../../../paint/painters";
import { DocumentModel } from "../../document.model";
import { RescaleManager } from "../../rescale-manager";
import { DrawingTool } from "../tool.basic";

/**
 * Allows to draw with the mouse on a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.2
 * @internal
 */
export class FreehandTool extends DrawingTool implements Freehand {

    private readonly polylineRenderedEvent: Subject<DrawEvent<PolyLine>> = new Subject<DrawEvent<PolyLine>>();
    private readonly dispose$: Subject<void> = new Subject<void>();

    /**
     * A hot {@code Observable} which emits a {@link DrawEvent<PolyLine>} after a line is rendered.
     */
    readonly afterLineRendered: Observable<DrawEvent<PolyLine>> = this.polylineRenderedEvent.asObservable();

    protected readonly onFinish: Observable<void>;

    private color: Color = colorFrom(Colors.BLACK);

    /**
     * Normalized stroke width.
     * Therefore stroke size 1 equals to a size of 1px with a document scale of 1.
     */
    private strokeWidth: number = 1;

    /**
     * Poly line painter instance used during mousedown, mousemove and mouseup.
     */
    private polyLinePainter?: PolyLinePainter;

    constructor(
        document: DocumentModel,
        private readonly rescaleManager: RescaleManager
    ) {
        super(document);

        this.stateChange.subscribe((it) => {
            if (it.isActive) {
                this.listenToInput();
            } else {
                this.stopListeningToInput();
            }
        });

        // use our after line rendered observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.polylineRenderedEvent.asObservable().pipe(mapTo(undefined));
    }

    setColor(color: Color): Freehand {
        this.color = color;
        return this;
    }

    /**
     * Set the normalized stroke width.
     * A stroke width of 1 equals to a size of 1px with a document scale of 1.
     * @param {number} px The normal size of the stroke width.
     *
     * @return {Freehand} Returns it self for fluent calls.
     */
    setStrokeWidth(px: number): Freehand {
        this.strokeWidth = px;
        return this;
    }

    private listenToInput(): void {
        const startEvent: Observable<MouseEvent | TouchEvent> = merge(this.touchStart, this.mouseDown);
        const moveEvent: Observable<MouseEvent | TouchEvent> = merge(this.touchMove, this.mouseMove);
        const endEvent: Observable<MouseEvent | TouchEvent> = merge(this.touchEnd, this.touchCancel, this.mouseUp);

        let state: DrawingState = DrawingState.FINISHED;
        merge(startEvent, moveEvent, endEvent).pipe(
            tap((it) => {
                if (this.isStartEvent(it) && state === DrawingState.FINISHED) {
                    this.startDrawing(it);
                    state = DrawingState.RUNNING;
                    return;
                }

                // If the user starts another touch action finish drawing
                if (this.isStartEvent(it) && state === DrawingState.RUNNING) {
                    this.endDrawing();
                    state = DrawingState.FINISHED;
                    return;
                }

                if (this.isMoveEvent(it)) {
                    this.updateDrawing(it);
                    return;
                }

                if (this.isEndEvent(it)) {
                    this.endDrawing(it);
                    state = DrawingState.FINISHED;
                    return;
                }
            }),
            takeUntil(this.dispose$)
        ).subscribe();
    }

    private stopListeningToInput(): void {
        this.dispose$.next();
    }

    private startDrawing(event: MouseEvent | TouchEvent): void {
        if ("touches" in event && event.touches.length > 1) {
            return;
        }
        // we store the painter, because we need the same one in the other observables
        this.polyLinePainter = this.page.drawLayer.polyLine();

        const position: Point = this.calcRelativePosition(event);

        this.polyLinePainter
            .borderColor(this.color)
            .borderWidth(this.rescaleManager.rescalePixel(this.strokeWidth))
            .beginLine(position);
    }

    private updateDrawing(event: MouseEvent | TouchEvent): void {
        if ("touches" in event && event.touches.length > 1) {
            return;
        }

        if (!this.polyLinePainter) {
            return;
        }

        const position: Point = this.calcRelativePosition(event);
        this.polyLinePainter.drawTo(position);
    }

    private endDrawing(event?: MouseEvent | TouchEvent): void {

        if (!this.polyLinePainter) {
            return;
        }

        let createdPolyLine: PolyLine;
        if (!!event) {
            const position: Point = this.calcRelativePosition(event);
            createdPolyLine = this.polyLinePainter
                .endLine(position)
                .transform();
        } else {
            createdPolyLine = this.polyLinePainter
                .endLine()
                .transform();
        }



        this.polylineRenderedEvent.next(new DrawEvent<PolyLine>(createdPolyLine, this.page.pageNumber, PageLayer.DRAWING));

        this.polyLinePainter = undefined; // now we can clear the painter, because the mousedown, mousemove, mouseup chain is finished
    }
}

enum DrawingState {
    RUNNING,
    FINISHED
}
