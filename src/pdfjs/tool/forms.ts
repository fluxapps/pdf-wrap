import { Logger } from "typescript-logging";
import { Point } from "../../api/draw/draw.basic";
import { Circle, Ellipse, Line, Rectangle } from "../../api/draw/elements";
import { DrawEvent, PageLayer } from "../../api/storage/page.event";
import { BorderForm, Forms, StandardForm } from "../../api/tool/forms";
import { LoggerFactory } from "../../log-config";
import { CanvasCircle, CanvasEllipse, CanvasLine, CanvasRectangle } from "../../paint/canvas.elements";
import { DocumentModel, Page } from "../document.model";
import { RescaleManager } from "../rescale-manager";
import { AbstractBorderForm, AbstractStandardForm } from "./form.basic";

/**
 * Line form implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
class LineForm extends AbstractBorderForm<Line> {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/forms:LineForm");

    constructor(document: DocumentModel, private readonly rescaleManager: RescaleManager) {
        super(document);
    }

    create(): void {
        const page: Page = this.document.getPage();
        const start: Point = this.position;
        const end: Point = {
            x: start.x + (Math.min(page.pageDimension.width, page.pageDimension.height) * 0.4),
            y: start.y
        };
        const canvasLine: CanvasLine = page.drawLayer.line()
            .borderColor(this.borderColor)
            .borderWidth(this.rescaleManager.rescalePixel(this.borderWith))
            .start(start)
            .end(end)
            .paint();

        const line: Line = canvasLine.transform();
        this._afterPaintCompleted.next(new DrawEvent<Line>(line, page.pageNumber, PageLayer.DRAWING));

        this.log.trace(`Spawned line with id: ${line.id}`);
    }
}

/**
 * Rectangle form implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
class RectangleForm extends AbstractStandardForm<Rectangle> {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/forms:RectangleForm");

    constructor(document: DocumentModel, private readonly rescaleManager: RescaleManager) {
        super(document);
    }

    create(): void {
        const page: Page = this.document.getPage();
        const position: Point = this.position;
        const size: number = Math.min(page.pageDimension.width, page.pageDimension.height) * 0.15;

        const canvasRectangle: CanvasRectangle = page.drawLayer.rectangle()
            .borderWidth(this.rescaleManager.rescalePixel(this.borderWith))
            .borderColor(this.borderColor)
            .fillColor(this.fillColor)
            .position(position)
            .dimension({
                height: size,
                width: size,
            })
            .paint();

        const rectangle: Rectangle = canvasRectangle.transform();
        this._afterPaintCompleted.next(new DrawEvent<Rectangle>(rectangle, page.pageNumber, PageLayer.DRAWING));

        this.log.trace(`Spawned rectangle with id: ${rectangle.id}`);
    }
}

/**
 * Ellipse form implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
class EllipseForm extends AbstractStandardForm<Ellipse> {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/forms:EllipseForm");

    constructor(document: DocumentModel, private readonly rescaleManager: RescaleManager) {
        super(document);
    }

    create(): void {
        const page: Page = this.document.getPage();
        const position: Point = this.position;
        const size: number = Math.min(page.pageDimension.width, page.pageDimension.height) * 0.15;

        const canvasEllipse: CanvasEllipse = page.drawLayer.ellipse()
            .borderWidth(this.rescaleManager.rescalePixel(this.borderWith))
            .borderColor(this.borderColor)
            .fillColor(this.fillColor)
            .position(position)
            .dimension({
                height: size,
                width: size * 1.2,
            })
            .paint();

        const ellipse: Ellipse = canvasEllipse.transform();
        this._afterPaintCompleted.next(new DrawEvent<Ellipse>(ellipse, page.pageNumber, PageLayer.DRAWING));

        this.log.trace(`Spawned ellipse with id: ${ellipse.id}`);
    }
}

/**
 * Circle form implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
class CircleForm extends AbstractStandardForm<Circle> {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/tool/forms:CircleForm");

    constructor(document: DocumentModel, private readonly rescaleManager: RescaleManager) {
        super(document);
    }

    create(): void {
        const page: Page = this.document.getPage();
        const position: Point = this.position;
        const size: number = Math.min(page.pageDimension.width, page.pageDimension.height) * 0.20;

        const canvasCircle: CanvasCircle = page.drawLayer.circle()
            .borderWidth(this.rescaleManager.rescalePixel(this.borderWith))
            .borderColor(this.borderColor)
            .fillColor(this.fillColor)
            .position(position)
            .diameter(size)
            .paint();

        const circle: Circle = canvasCircle.transform();
        this._afterPaintCompleted.next(new DrawEvent<Circle>(circle, page.pageNumber, PageLayer.DRAWING));

        this.log.trace(`Spawned circle with id: ${circle.id}`);
    }

}

/**
 * Forms Factory.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class FormFactory implements Forms {

    private _circle: CircleForm | null = null;
    private _ellipse: EllipseForm | null = null;
    private _line: LineForm | null = null;
    private _rectangle: RectangleForm | null = null;

    constructor(private readonly document: DocumentModel, private readonly rescaleManager: RescaleManager) {

    }

    get circle(): StandardForm<Circle> {
        if (!this._circle) {
            this._circle = new CircleForm(this.document, this.rescaleManager);
        }

        return this._circle;
    }

    get ellipse(): StandardForm<Ellipse> {
        if (!this._ellipse) {
            this._ellipse = new EllipseForm(this.document, this.rescaleManager);
        }

        return this._ellipse;
    }

    get line(): BorderForm<Line> {
        if (!this._line) {
            this._line = new LineForm(this.document, this.rescaleManager);
        }

        return this._line;
    }

    get rectangle(): StandardForm<Rectangle> {
        if (!this._rectangle) {
            this._rectangle = new RectangleForm(this.document, this.rescaleManager);
        }

        return this._rectangle;
    }
}
