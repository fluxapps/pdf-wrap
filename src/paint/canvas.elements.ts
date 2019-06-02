import { Subscriber } from "rxjs/internal-compatibility";
import { Observable } from "rxjs/internal/Observable";
import { TeardownLogic } from "rxjs/internal/types";
import { Logger } from "typescript-logging";
import { Color, colorFromHex, colorFromRgba } from "../api/draw/color";
import { Dimension, Point } from "../api/draw/draw.basic";
import { Circle, DrawElement, Ellipse, Line, PolyLine, Rectangle } from "../api/draw/elements";
import { pairwise } from "../arrays";
import { LoggerFactory } from "../log-config";
import { ElementBuilderFactoryImpl } from "./element.builders.impl";
import { ElementDragEventMap, ElementResizeEventMap } from "./events";

import svgjs from "svg.js";

// Do really nasty stuff to fix the test environment which hasn't a window.
/* tslint:disable */
if (typeof window === "undefined") {
    global.SVG = svgjs;
    svgjs.extend = () => {};
    // @ts-ignore
    svgjs.Element = {};
    svgjs.Element.prototype = {};
    svgjs.Element.prototype.selectize = {};
    svgjs.Element.prototype.resize = {};
    svgjs.Element.prototype.selectize.defaults = {};
    svgjs.Element.prototype.resize.defaults = {};
} else {
    window.SVG = svgjs;
}
/* tslint:enable */

import "svg.select.js";
import "svg.draggable.js";
import "svg.resize.js";

type ElementEventMap = (HTMLElementEventMap & ElementDragEventMap & ElementResizeEventMap);

/**
 * Describes a transformable object which can transform itself to the given type {@code T}.
 *
 * @param T - the result type of the transformation
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface Transformable<T> {

    /**
     * Transforms this object to the type of {@code T}.
     *
     * @returns {T} the transformed object
     */
    transform(): T;
}

/**
 * Describes an element which supports various interactions.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface InteractiveElement {
    /**
     * Renders a selection box around the element.
     */
    selected: boolean;

    /**
     * Defines if a selected element is draggable or not.
     */
    draggable: boolean;

    /**
     * Defines if a selected element is resizable or not.
     */
    resizable: boolean;
}

/**
 * Describes an element used on a {@link Canvas}.
 *
 * @param T - the type to transform in
 *
 * A {@code CanvasElement} can be transformed into a {@link DrawElement}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export interface CanvasElement<T extends DrawElement> extends Transformable <T>, InteractiveElement {

    /**
     * Removes this element from the canvas.
     */
    remove(): void;

    /**
     * Moves the one position forwards.
     */
    forwards(): void;
    /**
     * Moves the one position backwards.
     */
    backwards(): void;

    /**
     * Moves the item to the front.
     */
    toFront(): void;

    /**
     * Moves the item to the back.
     */
    toBack(): void;

    /**
     * Returns a {@code Observable} which emits on the given {@code event}.
     *
     * @param {K} event - the event to listen on
     *
     * @returns {Observable<R[K]>} the resulting observable with the event type of the event.
     */
    on<R extends ElementEventMap, K extends Extract<keyof R, string>>(event: K): Observable<R[K]>;
}

/**
 * Describes an element used on a {@link Canvas}.
 * The element is interactive and supports the
 * update of its border style and size.
 *
 * @param T - the type to transform in
 *
 * A {@code CanvasElement} can be transformed into a {@link DrawElement}.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface CanvasBorderElement<T extends DrawElement> extends CanvasElement<T> {
    borderWidth: number;
    borderColor: Color;
}

/**
 * Describes an element used on a {@link Canvas}.
 * The element is interactive and supports the
 * update of its border style and size as well as its
 * fill color.
 *
 * @param T - the type to transform in
 *
 * A {@code CanvasElement} can be transformed into a {@link DrawElement}.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export interface CanvasFormElement<T extends DrawElement> extends CanvasBorderElement<T> {
    fillColor: Color;
}

/**
 * Abstract base implementation of all border elements.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
abstract class AbstractCanvasBorderElement<T extends DrawElement> implements CanvasBorderElement<T> {

    private isSelected: boolean = false;
    private isDraggable: boolean = false;
    private isResizable: boolean = false;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/canvas.elements:AbstractCanvasBorderElement");

    protected constructor(private readonly borderElement: svgjs.Element) {}

    get selected(): boolean {
        return this.isSelected;
    }

    set selected(value: boolean) {
        if (this.isSelected === value) { return; }
        this.borderElement.selectize(value);
        this.isSelected = value;
    }

    get draggable(): boolean {
        return this.isDraggable;
    }

    set draggable(value: boolean) {
        if (this.isDraggable === value) { return; }
        this.borderElement.draggable(value);
        this.isDraggable = value;
    }

    get resizable(): boolean {
        return this.isResizable;
    }

    set resizable(value: boolean) {
        if (this.isResizable === value) { return; }
        value ? this.borderElement.resize() : this.borderElement.resize("stop");
        this.isResizable = value;
    }

    get borderColor(): Color {
        const color: Color = colorFromHex(this.borderElement.attr("stroke"));
        const alpha: number = parseFloat(this.borderElement.attr("stroke-opacity"));
        return colorFromRgba(color.red, color.green, color.blue, alpha);
    }

    set borderColor(value: Color) {
        this.borderElement.stroke({color: value.hex("#XXXXXX"), opacity: value.alpha});
    }

    get borderWidth(): number {
        return this.borderElement.attr("stroke-width");
    }

    set borderWidth(value: number) {
        this.borderElement.attr("stroke-width", value);
    }

    backwards(): void {
        this.borderElement.backward();
    }

    forwards(): void {
        this.borderElement.forward();
    }

    toBack(): void {
        this.borderElement.back();
    }

    toFront(): void {
        this.borderElement.front();
    }

    on<R extends ElementEventMap, K extends Extract<keyof R, string>>(event: K): Observable<R[K]> {
        return new Observable((subscriber: Subscriber<R[K]>): TeardownLogic => {
            const callback: (it: R[K]) => void = (it: R[K]): void => subscriber.next(it);
            this.borderElement.on(event, callback, this, {passive: true});

            // We dont need to specify the options because the removeEventListener does only care about the "useCapture" and the "capture" option.
            return (): void => { this.borderElement.off(event, callback); };
        });
    }

    remove(): void {
        this.log.trace(() => `Remove svg poly line element: id=${this.borderElement.id()}`);
        // @ts-ignore
        this.borderElement.off();
        this.borderElement.remove();
    }

    abstract transform(): T;
}

/**
 * Abstract base implementation of all form elements.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
abstract class AbstractCanvasFormElement<T extends DrawElement> extends AbstractCanvasBorderElement<T> implements CanvasFormElement<T> {

    protected constructor(private readonly formElement: svgjs.Element) {
        super(formElement);
    }

    get fillColor(): Color {
        const color: Color = colorFromHex(this.formElement.attr("fill"));
        const alpha: number = parseFloat(this.formElement.attr("fill-opacity"));
        return colorFromRgba(color.red, color.green, color.blue, alpha);
    }

    set fillColor(value: Color) {
        this.formElement.fill({color: value.hex("#XXXXXX"), opacity: value.alpha});
    }
}

/**
 * A poly line used on a {@link Canvas}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class CanvasPolyLine extends AbstractCanvasBorderElement<PolyLine> {

    private static readonly POINT_FORMAT_AFTER_TRANSFORMATION: RegExp = /^(?:(\d+(:?\.\d+)?),(\d+(:?\.\d+)?)\s?)+$/;

    private get coordinates(): Array<Point> {

        // We have a different point format after the polyline transformation ...
        const points: string = this.element.attr("points") as string;
        if (CanvasPolyLine.POINT_FORMAT_AFTER_TRANSFORMATION.test(points)) {
            return points.split(" ")
                .map<Array<string>>((it) => it.split(","))
                .map<Point>((it) => {
                    const [x, y, z]: [number, number, number] = [parseFloat(it[0]), parseFloat(it[1]), this.element.position()];

                    return {x, y, z};
                });
        }

        return pairwise((this.element.attr("points") as string).split(","))
            .map<Point>((it) => {
                const [x, y, z]: [number, number, number] = [parseFloat(it[0]), parseFloat(it[1]), this.element.position()];

                return {x, y, z};
            });
    }

    constructor(private readonly element: svgjs.PolyLine) {
        super(element);
    }

    transform(): PolyLine {
        return new ElementBuilderFactoryImpl().polyLine()
            .id(this.element.id())
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .coordinates(this.coordinates)
            .build();
    }
}

/**
 * A rectangle used on a {@link Canvas}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class CanvasRectangle extends AbstractCanvasFormElement<Rectangle> {

    private get position(): Point {
        const [x, y, z]: [number, number, number] = [
            parseFloat(this.element.attr("x")),
            parseFloat(this.element.attr("y")),
            this.element.position()
        ];
        return {x, y, z};
    }

    private get dimension(): Dimension {
        const [height, width]: [number, number] = [
            parseFloat(this.element.attr("height")),
            parseFloat(this.element.attr("width"))
        ];
        return {height, width};
    }

    constructor(private readonly element: svgjs.Rect) {
        super(element);
    }

    transform(): Rectangle {
        return new ElementBuilderFactoryImpl().rectangle()
            .id(this.element.id())
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .fillColor(this.fillColor)
            .position(this.position)
            .dimension(this.dimension)
            .build();
    }
}

/**
 * A circle used on a {@link Canvas}.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export class CanvasCircle extends AbstractCanvasFormElement<Circle> {

    private get position(): Point {
        const [x, y, z]: [number, number, number] = [this.element.x(), this.element.y(), this.element.position()];
        return {x, y, z};
    }

    private get diameter(): number {
        return (parseFloat(this.element.attr("r")) * 2);
    }

    constructor(private readonly element: svgjs.Circle) {
        super(element);
    }

    transform(): Circle {
        return new ElementBuilderFactoryImpl().circle()
            .id(this.element.id())
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .fillColor(this.fillColor)
            .position(this.position)
            .diameter(this.diameter)
            .build();
    }
}

/**
 * A ellipse used on a {@link Canvas}.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export class CanvasEllipse extends AbstractCanvasFormElement<Ellipse> {

    private get position(): Point {
        const [x, y, z]: [number, number, number] = [this.element.x(), this.element.y(), this.element.position()];
        return {x, y, z};
    }

    private get dimension(): Dimension {
        const [height, width]: [number, number] = [
            parseFloat(this.element.attr("ry")) * 2,
            parseFloat(this.element.attr("rx")) * 2
        ];
        return {height, width};
    }

    constructor(private readonly element: svgjs.Ellipse) {
        super(element);
    }

    transform(): Ellipse {
        return new ElementBuilderFactoryImpl().ellipse()
            .id(this.element.id())
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .fillColor(this.fillColor)
            .position(this.position)
            .dimension(this.dimension)
            .build();
    }
}

/**
 * A line used on a {@link Canvas}.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 * @internal
 */
export class CanvasLine extends AbstractCanvasBorderElement<Line> {

    private get start(): Point {
        return {
            x: parseFloat(this.element.attr("x1")),
            y: parseFloat(this.element.attr("y1")),
            z: this.element.position()
        };
    }

    private get end(): Point {
        return {
            x: parseFloat(this.element.attr("x2")),
            y: parseFloat(this.element.attr("y2")),
            z: this.element.position()
        };
    }

    constructor(private readonly element: svgjs.Line) {
        super(element);
    }

    transform(): Line {
        return new ElementBuilderFactoryImpl().line()
            .id(this.element.id())
            .borderColor(this.borderColor)
            .borderWidth(this.borderWidth)
            .start(this.start)
            .end(this.end)
            .build();
    }
}
