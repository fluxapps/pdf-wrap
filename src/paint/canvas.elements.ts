import {Subscriber} from "rxjs/internal-compatibility";
import {DrawElement, PolyLine, Rectangle} from "../api/draw/elements";
import {ElementBuilderFactoryImpl} from "./element.builders.impl";
import {Color, colorFromHex} from "../api/draw/color";
import {Dimension, Point} from "../api/draw/draw.basic";
import {Observable} from "rxjs/internal/Observable";
import {pairwise} from "../arrays";
import * as svgjs from "svgjs";
import {TeardownLogic} from "rxjs/internal/types";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";

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
export interface CanvasElement<T extends DrawElement> extends Transformable <T> {

    /**
     * Removes this element from the canvas.
     */
    remove(): void;

    /**
     * Returns a {@code Observable} which emits on the given {@code event}.
     *
     * @param {R} event - the event to listen on
     *
     * @returns {Observable<R>} the resulting observable
     */
    on<R extends keyof HTMLElementEventMap>(event: R): Observable<R>;
}

/**
 * A poly line used on a {@link Canvas}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class CanvasPolyLine implements CanvasElement<PolyLine> {

    private get coordinates(): Array<Point> {

        return pairwise((this.element.attr("points") as string).split(","))
            .map<Point>((it) => {
                const [x, y]: [number, number] = [parseFloat(it[0]), parseFloat(it[1])];

                return {x, y};
            });
    }

    private get color(): Color {
        return colorFromHex(this.element.attr("stroke"));
    }

    private get width(): number {
        return this.element.attr("stroke-width");
    }

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/canvas.elements:CanvasPolyLine");

    constructor(
        private readonly element: svgjs.PolyLine
    ) {}

    on<T extends keyof HTMLElementEventMap>(event: T): Observable<T> {
        return new Observable((subscriber: Subscriber<T>): TeardownLogic => {
            this.element.on(event, () => subscriber.next(event));
        });
    }

    remove(): void {
        this.log.trace(() => `Remove svg poly line element: id=${this.element.id()}`);
        this.element.remove();
    }

    transform(): PolyLine {
        return new ElementBuilderFactoryImpl().polyLine()
            .id(this.element.id())
            .borderColor(this.color)
            .borderWidth(this.width)
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
export class CanvasRectangle implements CanvasElement<Rectangle> {

    private get borderColor(): Color {
        return colorFromHex(this.element.attr("stroke"));
    }

    private get borderWidth(): number {
        return this.element.attr("stroke-width");
    }

    private get fillColor(): Color {
        return colorFromHex(this.element.attr("fill"));
    }

    private get position(): Point {
        const [x, y]: [number, number] = [parseFloat(this.element.attr("x")), parseFloat(this.element.attr("y"))];
        return {x, y};
    }

    private get dimension(): Dimension {
        const [height, width]: [number, number] = [
            parseFloat(this.element.attr("height")),
            parseFloat(this.element.attr("width"))
        ];
        return {height, width};
    }

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/canvas.elements:CanvasRectangle");

    constructor(
        private readonly element: svgjs.Rect
    ) {}

    on<T extends keyof HTMLElementEventMap>(event: T): Observable<T> {
        return new Observable((subscriber: Subscriber<T>): TeardownLogic => {
            this.element.on(event, () => subscriber.next(event));
        });
    }

    remove(): void {
        this.log.trace(() => `Remove svg rectangle element: id=${this.element.id()}`);
        this.element.remove();
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