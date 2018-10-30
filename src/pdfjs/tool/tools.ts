import {DrawingTool} from "./tool.basic";
import {Observable} from "rxjs/internal/Observable";
import {DrawEvent, PageLayer} from "../../api/storage/page.event";
import {DrawElement, PolyLine} from "../../api/draw/elements";
import {DocumentModel} from "../document.model";
import {Subscriber} from "rxjs/internal-compatibility";
import {Point} from "../../api/draw/draw.basic";
import {Eraser, Freehand} from "../../api/tool/toolbox";
import {Color, colorFrom, Colors} from "../../api/draw/color";
import {map, share, takeUntil, takeWhile} from "rxjs/operators";
import {TeardownLogic} from "rxjs/internal/types";
import {PolyLinePainter} from "../../paint/painters";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../../log-config";
import {RescaleManager} from "../rescale-manager";

/**
 * Allows to draw with the mouse on a PDF page.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class FreehandTool extends DrawingTool implements Freehand {

    /**
     * A hot {@code Observable} which emits a {@link DrawEvent<PolyLine>} after a line is rendered.
     */
    readonly afterLineRendered: Observable<DrawEvent<PolyLine>>;

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

        this.afterLineRendered = new Observable((subscriber: Subscriber<DrawEvent<PolyLine>>): TeardownLogic => {

            this.mouseDown.subscribe((it) => {

                // we store the painter, because we need the same one in the other observables
                this.polyLinePainter = this.page.drawLayer.polyLine();

                const position: Point = this.calcRelativePosition(it);

                this.polyLinePainter
                    .borderColor(this.color)
                    .borderWidth(this.rescaleManager.rescaleBorderWidth(this.strokeWidth))
                    .beginLine(position);
            });

            this.mouseMove.subscribe((it) => {
                const position: Point = this.calcRelativePosition(it);
                this.polyLinePainter!.drawTo(position);
            });

            this.mouseUp.subscribe((it) => {

                const position: Point = this.calcRelativePosition(it);
                const createdPolyLine: PolyLine = this.polyLinePainter!
                    .endLine(position)
                    .transform();

                subscriber.next(new DrawEvent<PolyLine>(createdPolyLine, this.page.pageNumber, PageLayer.DRAWING));

                this.polyLinePainter = undefined; // now we can clear the painter, because the mousedown, mousemove, mouseup chain is finished
            });
        }).pipe(share());

        // use our after line rendered observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.afterLineRendered.pipe(map((_) => {/* return void */}));
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
}

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

            this.mouseDown.subscribe(() => {
                this.page.drawLayer.select(".drawing")
                    .forEach((it) => {

                        it.on("mouseover")
                            .pipe(takeWhile(() => this.hasPage))
                            .pipe(takeUntil(this.mouseUp))
                            .subscribe(() => {

                                this.eraserLog.debug(() => `Remove drawing with id: ${it.transform().id}`);

                                const drawEvent: DrawEvent<DrawElement> = new DrawEvent(
                                    it.transform(),
                                    this.page.pageNumber,
                                    PageLayer.DRAWING
                                );

                                subscriber.next(drawEvent);

                                it.remove();
                            });
                });
            });
        });

        // use our after element removed observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.afterElementRemoved.pipe(map((_) => {/* return void */}));
    }
}
