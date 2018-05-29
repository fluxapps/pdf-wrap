import {ElementBuilderFactory, PolyLineBuilder, RectangleBuilder} from "../api/draw/element.builders";
import {Dimension, Point} from "../api/draw/draw.basic";
import {PolyLine, Rectangle} from "../api/draw/elements";
import {Color, colorFrom, Colors} from "../api/draw/color";
import {DrawablePolyLine, DrawableRectangle} from "./elements.impl";
import uuid from "uuid-js";
import * as log4js from "@log4js-node/log4js-api";

const logger: log4js.Logger = log4js.getLogger("pdf-wrap");

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

    /* tslint:disable: variable-name */
    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.BLACK);
    private _coordinates: Array<Point> = [];
    /* tslint:enable */

    id(value: string): PolyLineBuilder {
        this._id = value;
        return this;
    }

    borderColor(value: Color): PolyLineBuilder {
        this._borderColor = value;
        return this;
    }

    coordinates(value: Array<Point>): PolyLineBuilder {
        this._coordinates = value;
        return this;
    }

    build(): PolyLine {

        logger.trace(`Build poly line element: polyLineId=${this._id}`);

        return new DrawablePolyLine(
            this._borderColor,
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

    /* tslint:disable: variable-name */
    private _id: string = `$svg${uuid.create(4).toString()}`;
    private _borderColor: Color = colorFrom(Colors.NONE);
    private _fillColor: Color = colorFrom(Colors.BLACK);
    private _dimension: Dimension = {height: 0, width: 0};
    private _position: Point = {x: 0, y: 0};
    /* tslint:enable */

    id(value: string): RectangleBuilder {
        this._id = value;
        return this;
    }

    borderColor(value: Color): RectangleBuilder {
        this._borderColor = value;
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

        logger.trace(`Build rectangle element: rectangleId=${this._id}`);

        return new DrawableRectangle(
            this._borderColor,
            this._dimension,
            this._fillColor,
            this._id,
            this._position
        );
    }
}
