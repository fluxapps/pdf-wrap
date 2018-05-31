import {DrawingTool} from "./tool.basic";
import {Observable} from "rxjs/internal/Observable";
import {DrawEvent, PageLayer} from "../../api/storage/page.event";
import {DrawElement, PolyLine} from "../../api/draw/elements";
import {DocumentModel} from "../document.model";
import {Subscriber} from "rxjs/internal-compatibility";
import {Point} from "../../api/draw/draw.basic";
import {Eraser, Freehand} from "../../api/tool/toolbox";
import {Color, colorFrom, Colors} from "../../api/draw/color";
import {share, takeWhile} from "rxjs/operators";
import {TeardownLogic} from "rxjs/internal/types";

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

    private color: Color = colorFrom(Colors.BLACK);
    private strokeWidth: number = 1;

    constructor(
        document: DocumentModel
    ) {
        super(document);

        this.afterLineRendered = new Observable((subscriber: Subscriber<DrawEvent<PolyLine>>): TeardownLogic => {

            this.mouseDown.subscribe((it) => {
                const position: Point = this.calcRelativePosition(it);

                this.page.drawLayer.polyLine()
                    .borderColor(this.color)
                    .borderWidth(this.strokeWidth)
                    .beginLine(position);
            });

            this.mouseOver.subscribe((it) => {
                const position: Point = this.calcRelativePosition(it);
                this.page.drawLayer.polyLine().drawTo(position);
            });

            this.mouseUp.subscribe((it) => {
                const position: Point = this.calcRelativePosition(it);
                const createdPolyLine: PolyLine = this.page.drawLayer.polyLine()
                    .endLine(position)
                    .transform();

                subscriber.next(new DrawEvent<PolyLine>(createdPolyLine, this.page.pageNumber, PageLayer.DRAWING));
            });
        }).pipe(share());
    }

    setColor(color: Color): Freehand {
        this.color = color;
        return this;
    }

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
                            .subscribe(() => {

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
    }
}
