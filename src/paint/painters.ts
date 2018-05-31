import {Color, colorFrom, Colors} from "../api/draw/color";
import {Dimension, Point} from "../api/draw/draw.basic";
import uuid from "uuid-js";
import * as log4js from "@log4js-node/log4js-api";
import {CanvasElement, CanvasPolyLine, CanvasRectangle} from "./canvas.elements";
import * as svgjs from "svgjs";
import {DrawElement} from "../api/draw/elements";

const logger: log4js.Logger = log4js.getLogger("pdf-wrap");

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

    constructor(
        private readonly svg: svgjs.Doc
    ) {}

    polyLine(): PolyLinePainter {
        return new SVGPolyLinePainter(this.svg);
    }

    rectangle(): RectanglePainter {
        return new SVGRectanglePainter(this.svg);
    }

    /**
     * Removes all elements matching the given {@code selector}.
     *
     * @param {string} selector - a html selector
     */
    remove(selector: string): void {
        this.select(selector).forEach((it) => it.remove());
    }

    /**
     * Returns all elements on this canvas matching
     * the given {@code selector}.
     *
     * Currently supported types:
     * - {@link CanvasRectangle}
     * - {@link CanvasPolyLine}
     *
     * @param {string} selector - a html selector
     *
     * @returns {Array<CanvasElement<object>>}
     */
    select(selector: string): Array<CanvasElement<DrawElement>> {

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
    endLine(position: Point): CanvasPolyLine;
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

    /* tslint:disable: variable-name */
    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.BLACK);
    private _borderWidth: number = 1;
    private _coordinates: Array<Point> = [];
    /* tslint:enable */

    private line?: svgjs.PolyLine;

    private get flatCoordinates(): string {
        return this._coordinates.map((it) => `${it.x}, ${it.y}`).join(",");
    }

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

        this.line!.plot(this.flatCoordinates);
    }

    /**
     * Finishes the process of {@code beginLine} and {@code drawLine}.
     *
     * @param {Point} position - the position on a canvas to end the line
     *
     * @returns the painted poly line
     * @throws {IllegalPaintStateError} if {@code beginLine} was not called before this method
     */
    endLine(position: Point): CanvasPolyLine {

        logger.trace(`Draw poly line on svg: polyLineId=${this._id}`);

        this.drawTo(position);

        const createdPolyLine: CanvasPolyLine = new CanvasPolyLine(this.line!);

        this.line = undefined;
        this._borderColor = colorFrom(Colors.BLACK);
        this._coordinates = [];

        return createdPolyLine;
    }

    private paintPolyLine(): svgjs.PolyLine {

        return this.svg.polyline(this.flatCoordinates)
            .fill("none")
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex()}`});
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

    /* tslint:disable: variable-name */
    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 0;
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _position: Point = {x: 0, y: 0};
    private _dimension: Dimension = {height: 0, width: 0};
    /* tslint:enable */

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

    paint(): CanvasRectangle {

        logger.trace(`Draw rectangle on svg: rectangleId=${this._id}`);

        const rect: svgjs.Rect = this.svg.rect(this._dimension.width, this._dimension.height)
            .fill(`${this._fillColor.hex()}`)
            .attr("id", this._id)
            .addClass("drawing")
            .stroke({width: this._borderWidth, color: `${this._borderColor.hex()}`})
            .move(this._position.x, this._position.y);

        return new CanvasRectangle(rect);
    }
}
