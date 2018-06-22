import {ElementBuilderFactory, PolyLineBuilder, RectangleBuilder} from "../api/draw/element.builders";
import {Dimension, Point} from "../api/draw/draw.basic";
import {PolyLine, Rectangle} from "../api/draw/elements";
import {Color, colorFrom, Colors} from "../api/draw/color";
import {DrawablePolyLine, DrawableRectangle} from "./elements.impl";
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
}

/**
 * Default poly line builder implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PolyLineBuilderImpl implements PolyLineBuilder {

    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.BLACK);
    private _borderWidth: number = 1;
    private _coordinates: Array<Point> = [];

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:PolyLineBuilderImpl");

    id(value: string): PolyLineBuilder {
        this._id = value;
        return this;
    }

    borderColor(value: Color): PolyLineBuilder {
        this._borderColor = value;
        return this;
    }

    borderWidth(px: number): PolyLineBuilder {
        this._borderWidth = px;
        return this;
    }

    coordinates(value: Array<Point>): PolyLineBuilder {
        this._coordinates = value;
        return this;
    }

    build(): PolyLine {

        this.log.trace(`Build poly line element: polyLineId=${this._id}`);

        return new DrawablePolyLine(
            this._borderColor,
            this._borderWidth,
            this._coordinates,
            this._id
        );
    }
}

/**
 * Default rectangle builder implementation.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class RectangleBuilderImpl implements RectangleBuilder {

    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _borderWidth: number = 1;
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _dimension: Dimension = {height: 0, width: 0};
    private _position: Point = {x: 0, y: 0};

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/paint/element.builders.impl:RectangleBuilderImpl");

    id(value: string): RectangleBuilder {
        this._id = value;
        return this;
    }

    borderColor(value: Color): RectangleBuilder {
        this._borderColor = value;
        return this;
    }

    borderWidth(px: number): RectangleBuilder {
        this._borderWidth = px;
        return this;
    }

    fillColor(value: Color): RectangleBuilder {
        this._fillColor = value;
        return this;
    }

    dimension(value: Dimension): RectangleBuilder {
        this._dimension = value;
        return this;
    }

    position(value: Point): RectangleBuilder {
        this._position = value;
        return this;
    }

    build(): Rectangle {

        this.log.trace(`Build rectangle element: rectangleId=${this._id}`);

        return new DrawableRectangle(
            this._borderColor,
            this._borderWidth,
            this._dimension,
            this._fillColor,
            this._id,
            this._position
        );
    }
}
