import * as svgjs from "svg.js";
import { Logger } from "typescript-logging";
import uuid from "uuid-js";
import { Color, colorFrom, Colors } from "../api/draw/color";
import { Dimension, Point } from "../api/draw/draw.basic";
import { DrawElement } from "../api/draw/elements";
import { LoggerFactory } from "../log-config";
import {
    CanvasCircle,
    CanvasElement,
    CanvasEllipse,
    CanvasLine,
    CanvasPolyLine,
    CanvasRectangle
} from "./canvas.elements";

/**
 * Describes a canvas which can be used to draw elements on.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface Canvas {
    rectangle(): RectanglePainter;
    polyLine(): PolyLinePainter;
    ellipse(): EllipsePainter;
    circle(): CirclePainter;
    line(): LinePainter;

    /**
     * Returns all elements on this canvas matching
     * the given {@code selector}.
     *
     * @param {string} selector - a html selector
     *
     * @returns {Array<CanvasElement<object>>}
     */
    select(selector: string): Array<CanvasElement<DrawElement>>;

    /**
     * Removes all elements matching the given {@code selector}.
     *
     * @param {string} selector - a html selector
     */
    remove(selector: string): void;
}

/**
 * Canvas implementation that used svgjs.
 * @see http://svgjs.com/
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class SVGCanvas implements Canvas {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/painters:SVGCanvas");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    polyLine(): PolyLinePainter {
        return new SVGPolyLinePainter(this.svg);
    }

    rectangle(): RectanglePainter {
        return new SVGRectanglePainter(this.svg);
    }

    ellipse(): EllipsePainter {
        return new SVGEllipsePainter(this.svg);
    }

    circle(): CirclePainter {
        return new SVGCirclePainter(this.svg);
    }

    line(): LinePainter {
        return new SVGLinePainter(this.svg);
    }

    /**
     * Removes all elements matching the given {@code selector}.
     *
     * @param {string} selector - a html selector
     */
    remove(selector: string): void {
        this.log.trace(() => `Remove svg elements by selector: selector=${selector}`);

        this.select(selector).forEach((it) => it.remove());
    }

    /**
     * Returns all elements on this canvas matching
     * the given {@code selector}.
     *
     * Currently supported types:
     * - {@link CanvasRectangle}
     * - {@link CanvasPolyLine}
     * - {@link CanvasEllipse}
     * - {@link CanvasCircle}
     * - {@link CanvasLine}
     *
     * @param {string} selector - a html selector
     *
     * @returns {Array<CanvasElement<object>>}
     */
    select(selector: string): Array<CanvasElement<DrawElement>> {

        this.log.trace(() => `Select svg elements by selector: selector=${selector}`);

        const svgElements: svgjs.Set = this.svg.select(selector);

        const canvasElements: Array<CanvasElement<DrawElement>> = [];

        for (let x: number = 0; x < svgElements.length(); x++) {

            const element: svgjs.Element = svgElements.get(x);

            switch (element.type) {
                case "rect":
                    canvasElements.push(new CanvasRectangle(element as svgjs.Rect));
                    break;
                case "polyline":
                    canvasElements.push(new CanvasPolyLine(element as svgjs.PolyLine));
                    break;
                case "ellipse":
                    canvasElements.push(new CanvasEllipse(element as svgjs.Ellipse));
                    break;
                case "circle":
                    canvasElements.push(new CanvasCircle(element as svgjs.Circle));
                    break;
                case "line":
                    canvasElements.push(new CanvasLine(element as svgjs.Line));
                    break;
            }
        }

        return canvasElements;
    }
}

/**
 * Describe a basic painter to draw on a canvas.
 *
 * @param R - the element type which will be painted
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface Painter<R extends CanvasElement<DrawElement>> {

    /**
     * Paints the element built with this painter on a canvas.
     *
     * @returns the painted element
     */
    paint(): R;
}

/**
 * Describes a generic border painter to draw an a canvas.
 *
 * @param T - the specific painter type for method chaining
 * @param R - the element type which will be painted
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface BorderPainter<T, R extends CanvasElement<DrawElement>> extends Painter<R> {
    borderColor(value: Color): T;
    borderWidth(value: number): T;
    rotation(value: number): T;
    id(value: string): T;
}

/**
 * Describes a polyline painter to draw lines on a canvas.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface PolyLinePainter extends BorderPainter<PolyLinePainter, CanvasPolyLine> {
    coordinates(value: Array<Point>): PolyLinePainter;

    /**
     * Start drawing a line on a canvas.
     * Must be invoked before {@code drawTo} or {@code endLine}.
     *
     * @param {Point} position - the position on a canvas to begin drawing the line
     */
    beginLine(position: Point): void;

    /**
     * Draws a line from the last position to the given {@code position}.
     *
     * @param {Point} position - the position on a canvas to draw the line to
     *
     * @throws {IllegalPaintStateError} if {@code beginLine} was not called before this method
     */
    drawTo(position: Point): void;

    /**
     * Finishes the process of {@code beginLine} and {@code drawLine}.
     *
     * @param {Point} position - the position on a canvas to end the line
     *
     * @returns the painted poly line
     * @throws {IllegalPaintStateError} if {@code beginLine} was not called before this method
     */
    endLine(position?: Point): CanvasPolyLine;
}

/**
 * Describes a generic from painter to draw on a canvas.
 *
 * @param T - the specific painter type for method chaining
 * @param R - the element type which will be painted
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface FormPainter<T, R extends CanvasElement<DrawElement>> extends BorderPainter<T, R> {
    position(value: Point): T;
    fillColor(value: Color): T;
}

/**
 * Describes a rectangle painter to draw rectangles on a canvas.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface RectanglePainter extends FormPainter<RectanglePainter, CanvasRectangle> {
    dimension(value: Dimension): RectanglePainter;
}

/**
 * Describes the painting interface of a line painter
 * which is responsible of drawing simple lines without a fill color.
 *
 * The color of lines are defined by its border color.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface LinePainter extends BorderPainter<LinePainter, CanvasLine> {

    /**
     * The start point of the line.
     *
     * @param {Point} value The start point.
     */
    start(value: Point): LinePainter;

    /**
     * The end point of the line.
     *
     * @param {Point} value The end point.
     */
    end(value: Point): LinePainter;
}

/**
 * Describes the painting interface of a circle painter
 * which may have a border and fill color.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface CirclePainter extends FormPainter<CirclePainter, CanvasCircle> {
    /**
     * The diameter of the circle (r*2).
     *
     * @param {number} value The diameter of the circle.
     */
    diameter(value: number): CirclePainter;
}

/**
 * Describes the painting interface of a ellipse painter
 * which may have a border and fill color.
 *
 * The ellipse size my be circular if the width and height of the
 * dimension is equal.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface EllipsePainter extends FormPainter<EllipsePainter, CanvasEllipse> {

    /**
     * The dimension of the ellipse.
     *
     * @param {Dimension} value The dimension of the ellipse.
     */
    dimension(value: Dimension): EllipsePainter;
}


/**
 * Indicates an error during a panting process of a {@link Painter}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class IllegalPaintStateError extends Error {}

/**
 * A poly line painter that uses svgjs.
 * @see http://svgjs.com/
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
class SVGPolyLinePainter implements PolyLinePainter {

    private _id: string = `svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.BLACK);
    private _borderWidth: number = 1;
    private _coordinates: Array<Point> = [];
    private _rotation: number = 0;

    private line?: svgjs.PolyLine;

    private get flatCoordinates(): string {
        return this._coordinates.map((it) => `${it.x}, ${it.y}`).join(",");
    }

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/painters:SVGPolyLinePainter");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    id(value: string): PolyLinePainter {
        this._id = value;
        return this;
    }

    borderColor(value: Color): PolyLinePainter {
        this._borderColor = value;
        return this;
    }

    borderWidth(value: number): PolyLinePainter {
        this._borderWidth = value;
        return this;
    }

    coordinates(value: Array<Point>): PolyLinePainter {
        this._coordinates = value;
        return this;
    }

    rotation(value: number): PolyLinePainter {
        this._rotation = value;
        return this;
    }

    paint(): CanvasPolyLine {
        return new CanvasPolyLine(this.paintPolyLine());
    }

    /**
     * Start drawing a line on a canvas.
     * Must be invoked before {@code drawTo} or {@code endLine}.
     *
     * Coordinates already added by the {@code coordinates} method are cleared before any painting is processed.
     * The color set by the {@code borderColor} method will be used for the line.
     *
     * @param {Point} position - the position on a canvas to begin drawing the line
     */
    beginLine(position: Point): void {

        if (this.line !== undefined) {
            throw new IllegalPaintStateError("Invoke PolyLinePainter.endLine first");
        }

        this._coordinates = [position];

        this.line = this.paintPolyLine();
    }

    /**
     * Draws a line from the last position to the given {@code position}.
     *
     * @param {Point} position - the position on a canvas to draw the line to
     *
     * @throws {IllegalPaintStateError} if {@code beginLine} was not called before this method
     */
    drawTo(position: Point): void {

        if (this.line === undefined) {
            throw new IllegalPaintStateError("PolyLinePainter.beginLine must be invoked first");
        }

        this._coordinates.push(position);

        this.line.plot(this.flatCoordinates);
    }

    /**
     * Finishes the process of {@code beginLine} and {@code drawLine}.
     *
     * @param {Point} position - the position on a canvas to end the line
     *
     * @returns the painted poly line
     * @throws {IllegalPaintStateError} if {@code beginLine} was not called before this method
     */
    endLine(position?: Point): CanvasPolyLine {

        this.log.trace(() => `Paint poly line on svg: polyLineId=${this._id}`);

        if (!!position) {
            this.drawTo(position);
        }

        const createdPolyLine: CanvasPolyLine = new CanvasPolyLine(this.line!);

        this.line = undefined;
        this._borderColor = colorFrom(Colors.BLACK);
        this._coordinates = [];

        return createdPolyLine;
    }

    private paintPolyLine(): svgjs.PolyLine {

        this.log.trace(() => `Paint poly line on svg: polyLineId=${this._id}`);

        const polyline: svgjs.PolyLine = this.svg.polyline(this.flatCoordinates)
            .fill("none")
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex("#XXXXXX")}`, opacity: this._borderColor.alpha})
            .rotate(this._rotation);

        return polyline;
    }
}

/**
 * A rectangle painter that uses svgjs.
 * @see http://svgjs.com/
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
class SVGRectanglePainter implements RectanglePainter {

    private _id: string = `svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 0;
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _position: Point = {x: 0, y: 0, z: 0};
    private _dimension: Dimension = {height: 0, width: 0};
    private _rotation: number = 0;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/SVGRectanglePainter");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    id(value: string): RectanglePainter {
        this._id = value;
        return this;
    }

    borderColor(value: Color): RectanglePainter {
        this._borderColor = value;
        return this;
    }

    borderWidth(value: number): RectanglePainter {
        this._borderWidth = value;
        return this;
    }

    position(value: Point): RectanglePainter {
        this._position = value;
        return this;
    }

    fillColor(value: Color): RectanglePainter {
        this._fillColor = value;
        return this;
    }

    dimension(value: Dimension): RectanglePainter {
        this._dimension = value;
        return this;
    }

    rotation(value: number): RectanglePainter {
        this._rotation = value;
        return this;
    }

    paint(): CanvasRectangle {

        this.log.trace(() => `Paint rectangle on svg: rectangleId=${this._id}`);

        const rect: svgjs.Rect = this.svg.rect(this._dimension.width, this._dimension.height)
            .fill({color: `${this._fillColor.hex("#XXXXXX")}`, opacity: this._fillColor.alpha})
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex("#XXXXXX")}`, opacity: this._borderColor.alpha})
            .move(this._position.x, this._position.y)
            .rotate(this._rotation);

        return new CanvasRectangle(rect);
    }
}

class SVGLinePainter implements LinePainter {

    private _id: string = `svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 0;
    private _start: Point = { x: 0, y: 0, z: 0};
    private _end: Point = { x: 0, y: 0, z: 0};
    private _rotation: number = 0;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/SVGLinePainter");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    borderColor(value: Color): LinePainter {
        this._borderColor = value;
        return this;
    }

    borderWidth(value: number): LinePainter {
        this._borderWidth = value;
        return this;
    }

    start(value: Point): LinePainter {
        this._start = value;
        return this;
    }

    end(value: Point): LinePainter {
        this._end = value;
        return this;
    }

    id(value: string): LinePainter {
        this._id = value;
        return this;
    }

    rotation(value: number): LinePainter {
        this._rotation = value;
        return this;
    }

    paint(): CanvasLine {
        this.log.trace(() => `Paint line on svg: lineId=${this._id}`);

        const line: svgjs.Line = this.svg.line(this._start.x, this._start.y, this._end.x, this._end.y)
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex("#XXXXXX")}`, opacity: this._borderColor.alpha})
            .rotate(this._rotation);

        return new CanvasLine(line);
    }
}

class SVGCirclePainter implements CirclePainter {

    private _id: string = `svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 0;
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _position: Point = {x: 0, y: 0, z: 0};
    private _diameter: number = 0;
    private _rotation: number = 0;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/SVGCirclePainter");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    borderColor(value: Color): CirclePainter {
        this._borderColor = value;
        return this;
    }

    borderWidth(value: number): CirclePainter {
        this._borderWidth = value;
        return this;
    }

    diameter(value: number): CirclePainter {
        this._diameter = value;
        return this;
    }

    fillColor(value: Color): CirclePainter {
        this._fillColor = value;
        return this;
    }

    id(value: string): CirclePainter {
        this._id = value;
        return this;
    }

    position(value: Point): CirclePainter {
        this._position = value;
        return this;
    }

    rotation(value: number): CirclePainter {
        this._rotation = value;
        return this;
    }

    paint(): CanvasCircle {

        this.log.trace(() => `Paint circle on svg: circleId=${this._id}`);

        const circle: svgjs.Circle = this.svg.circle(this._diameter)
            .fill({color: `${this._fillColor.hex("#XXXXXX")}`, opacity: this._fillColor.alpha})
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex("#XXXXXX")}`, opacity: this._borderColor.alpha})
            .move(this._position.x, this._position.y)
            .rotate(this._rotation);

        return new CanvasCircle(circle);
    }
}

class SVGEllipsePainter implements EllipsePainter {

    private _id: string = `svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 0;
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _position: Point = {x: 0, y: 0, z: 0};
    private _dimension: Dimension = {height: 0, width: 0};
    private _rotation: number = 0;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/SVGEllipsePainter");

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    borderColor(value: Color): EllipsePainter {
        this._borderColor = value;
        return this;
    }

    borderWidth(value: number): EllipsePainter {
        this._borderWidth = value;
        return this;
    }

    dimension(value: Dimension): EllipsePainter {
        this._dimension = value;
        return this;
    }

    fillColor(value: Color): EllipsePainter {
        this._fillColor = value;
        return this;
    }

    id(value: string): EllipsePainter {
        this._id = value;
        return this;
    }

    position(value: Point): EllipsePainter {
        this._position = value;
        return this;
    }

    rotation(value: number): EllipsePainter {
        this._rotation = value;
        return this;
    }

    paint(): CanvasEllipse {

        this.log.trace(() => `Paint ellipse on svg: ellipseId=${this._id}`);

        const ellipse: svgjs.Ellipse = this.svg.ellipse(this._dimension.width, this._dimension.height)
            .fill({color: `${this._fillColor.hex("#XXXXXX")}`, opacity: this._fillColor.alpha})
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex("#XXXXXX")}`, opacity: this._borderColor.alpha})
            .move(this._position.x, this._position.y)
            .rotate(this._rotation);

        return new CanvasEllipse(ellipse);
    }
}
