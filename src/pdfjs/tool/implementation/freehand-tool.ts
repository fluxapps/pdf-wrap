import { merge, Observable, Subscriber, TeardownLogic } from "rxjs";
import { map, share } from "rxjs/operators";
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


            merge(this.touchStart, this.mouseDown).subscribe((it) => {

                // we store the painter, because we need the same one in the other observables
                this.polyLinePainter = this.page.drawLayer.polyLine();

                const position: Point = this.calcRelativePosition(it);

                this.polyLinePainter
                    .borderColor(this.color)
                    .borderWidth(this.rescaleManager.rescalePixel(this.strokeWidth))
                    .beginLine(position);
            });

            merge(this.mouseMove, this.touchMove).subscribe((it) => {
                const position: Point = this.calcRelativePosition(it);
                this.polyLinePainter!.drawTo(position);
            });

            merge(this.mouseUp, this.touchEnd, this.touchCancel).subscribe((it) => {

                const position: Point = this.calcRelativePosition(it);
                const createdPolyLine: PolyLine = this.polyLinePainter!
                    .endLine(position)
                    .transform();

                subscriber.next(new DrawEvent<PolyLine>(createdPolyLine, this.page.pageNumber, PageLayer.DRAWING));

                this.polyLinePainter = undefined; // now we can clear the painter, because the mousedown, mousemove, mouseup chain is finished
            });
        }).pipe(share());

        // use our after line rendered observable and map it to void in order to emit on the onFinish observable
        this.onFinish = this.afterLineRendered.pipe(map((_) => {/* return void */
        }));
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
