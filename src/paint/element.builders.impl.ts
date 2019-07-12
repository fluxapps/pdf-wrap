import {
    BorderElementBuilder, CircleBuilder,
    ElementBuilderFactory, EllipseBuilder, FormBuilder,
    LineBuilder,
    PolyLineBuilder,
    RectangleBuilder
} from "../api/draw/element.builders";
import {Dimension, Point} from "../api/draw/draw.basic";
import { Circle, Ellipse, Line, PolyLine, Rectangle } from "../api/draw/elements";
import {Color, colorFrom, Colors} from "../api/draw/color";
import { DrawableCircle, DrawableEllipse, DrawableLine, DrawablePolyLine, DrawableRectangle } from "./elements.impl";
import uuid from "uuid-js";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";

/**
 * Default element builder factory implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class ElementBuilderFactoryImpl implements ElementBuilderFactory {

    polyLine(): PolyLineBuilder {
        return new PolyLineBuilderImpl();
    }

    rectangle(): RectangleBuilder {
        return new RectangleBuilderImpl();
    }

    circle(): CircleBuilder {
        return new CircleBuilderImpl();
    }

    ellipse(): EllipseBuilder {
        return new EllipseBuilderImpl();
    }

    line(): LineBuilder {
        return new LineBuilderImpl();
    }
}

/**
 * Abstract border element builder.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
abstract class AbstractBorderElementBuilder<T, R> implements BorderElementBuilder<T, R> {
    protected _id: string = `$svg${uuid.create(4).toString()}`;
    protected _borderColor: Color = colorFrom(Colors.BLACK);
    protected _borderWidth: number = 1;
    protected _rotation: number = 0;

    id(value: string): T {
        this._id = value;
        return (this as unknown) as T;
    }

    borderColor(value: Color): T {
        this._borderColor = value;
        return (this as unknown) as T;
    }

    borderWidth(px: number): T {
        this._borderWidth = px;
        return (this as unknown) as T;
    }


    rotation(value: number): T {
        this._rotation = value;
        return (this as unknown) as T;
    }


    abstract build(): R;
}

/**
 * Abstract form element builder.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
abstract class AbstractFormBuilder<T, R> extends AbstractBorderElementBuilder<T, R> implements FormBuilder<T, R> {

    protected _position: Point = {x: 0, y: 0, z: 0};
    protected _fillColor: Color = colorFrom(Colors.BLACK);

    fillColor(value: Color): T {
        this._fillColor = value;
        return (this as unknown) as T;
    }

    position(value: Point): T {
        this._position = value;
        return (this as unknown) as T;
    }
}

/**
 * Default poly line builder implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PolyLineBuilderImpl extends AbstractBorderElementBuilder<PolyLineBuilder, PolyLine> implements PolyLineBuilder {

    private _coordinates: Array<Point> = [];

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:PolyLineBuilderImpl");

    coordinates(value: Array<Point>): PolyLineBuilder {
        this._coordinates = value;
        return this;
    }

    build(): PolyLine {

        this.log.trace(() => `Build poly line element: polyLineId=${this._id}`);

        return new DrawablePolyLine(
            this._borderColor,
            this._borderWidth,
            this._coordinates,
            this._id,
            this._rotation
        );
    }
}

/**
 * Default rectangle builder implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class RectangleBuilderImpl extends AbstractFormBuilder<RectangleBuilder, Rectangle> implements RectangleBuilder {

    private _dimension: Dimension = {height: 0, width: 0};

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:RectangleBuilderImpl");

    dimension(value: Dimension): RectangleBuilder {
        this._dimension = value;
        return this;
    }

    build(): Rectangle {

        this.log.trace(() => `Build rectangle element: rectangleId=${this._id}`);

        return new DrawableRectangle(
            this._borderColor,
            this._borderWidth,
            this._dimension,
            this._fillColor,
            this._id,
            this._position,
            this._rotation
        );
    }
}

/**
 * Default line builder implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class LineBuilderImpl extends AbstractBorderElementBuilder<LineBuilder, Line> implements LineBuilder {

    private _start: Point = {x: 0, y: 0, z: 0};
    private _end: Point = {x: 0, y: 0, z: 0};

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:LineBuilderImpl");

    end(value: Point): LineBuilder {
        this._start = value;
        return this;
    }

    start(value: Point): LineBuilder {
        this._end = value;
        return this;
    }

    build(): Line {
        this.log.trace(() => `Build line element: lineId=${this._id}`);
        return new DrawableLine(
           this._borderColor,
           this._borderWidth,
           this._id,
           this._start,
           this._end,
           this._rotation
        );
    }
}

/**
 * Default circle builder implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class CircleBuilderImpl extends AbstractFormBuilder<CircleBuilder, Circle> implements CircleBuilder {

    private _diameter: number = 100;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:CircleBuilderImpl");


    build(): Circle {
        this.log.trace(() => `Build circle element: circleId=${this._id}`);

        return new DrawableCircle(
            this._borderColor,
            this._borderWidth,
            this._diameter,
            this._fillColor,
            this._id,
            this._position,
            this._rotation
        );
    }

    diameter(value: number): CircleBuilder {
        this._diameter = value;
        return this;
    }
}

/**
 * Default ellipse builder implementation.
 *
 * @author Nicolas Schaefli <ns@studer-raimann.ch>
 * @since 0.3.0
 */
export class EllipseBuilderImpl extends AbstractFormBuilder<EllipseBuilder, Ellipse> implements EllipseBuilder {

    private _dimension: Dimension = {height: 100, width: 100};

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:EllipseBuilderImpl");


    build(): Ellipse {
        this.log.trace(() => `Build ellipse element: ellipseId=${this._id}`);

        return new DrawableEllipse(
            this._borderColor,
            this._borderWidth,
            this._dimension,
            this._fillColor,
            this._id,
            this._position,
            this._rotation
        );
    }

    dimension(value: Dimension): EllipseBuilder {
        this._dimension = value;
        return this;
    }
}
