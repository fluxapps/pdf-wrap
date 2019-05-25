import { Circle, Ellipse, Line, PolyLine, Rectangle } from "../api/draw/elements";
import {Dimension, Point} from "../api/draw/draw.basic";
import {PDFViewer} from "pdfjs-dist/web/pdf_viewer";
import {ElementBuilderFactoryImpl} from "../paint/element.builders.impl";
import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";

/**
 * Manages the scaling of elements. It can normalize elements based on the viewers
 * scale and rescale them from a normalized state to the viewers current scale.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class RescaleManager {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/rescale-manager:RescaleManager");

    constructor(
        private readonly viewer: PDFViewer
    ) {}

    /**
     * Normalizes the given {@code polyLine} to the scale of 1.
     *
     * @param {PolyLine} polyLine - the poly line to normalize in scale
     *
     * @returns {PolyLine} the normalized poly line
     */
    normalizePolyLine(polyLine: PolyLine): PolyLine {

        this.log.trace(() => `Normalize poly line element: polyLineId=${polyLine.id}`);
        this.log.debug(() => `Normalize with current scale: scale=${this.viewer.currentScale}, polyline=${JSON.stringify(polyLine)}`);

        return new ElementBuilderFactoryImpl().polyLine()
            .id(polyLine.id)
            .borderColor(polyLine.borderColor)
            .borderWidth(this.normalizePixel(polyLine.borderWidth))
            .coordinates(polyLine.coordinates.map(this.normalizePosition.bind(this)))
            .build();
    }

    /**
     * Rescales the given {@code polyLine} to the current scale of the viewer.
     *
     * @param {PolyLine} polyLine - the poly line to rescale
     *
     * @returns {PolyLine} the rescaled poly line
     */
    rescalePolyLine(polyLine: PolyLine): PolyLine {

        this.log.trace(() => `Rescale poly line element: polyLineId=${polyLine.id}`);
        this.log.debug(() => `Rescale with current scale: scale=${this.viewer.currentScale}, polyline=${JSON.stringify(polyLine)}`);

        return new ElementBuilderFactoryImpl().polyLine()
            .id(polyLine.id)
            .borderColor(polyLine.borderColor)
            .borderWidth(this.rescalePixel(polyLine.borderWidth))
            .coordinates(polyLine.coordinates.map(this.rescalePosition.bind(this)))
            .build();
    }

    /**
     * Normalized the given {@code rectangle} to the scale of 1.
     *
     * @param {Rectangle} rectangle - the rectangle to normalize in scale
     *
     * @returns {Rectangle} the normalized rectangle
     */
    normalizeRectangle(rectangle: Rectangle): Rectangle {

        this.log.trace(() => `Normalize rectangle element: rectangleId=${rectangle.id}`);
        this.log.debug(() => `Normalize with current scale: scale=${this.viewer.currentScale}, rectangle=${JSON.stringify(rectangle)}`);

        return new ElementBuilderFactoryImpl().rectangle()
            .id(rectangle.id)
            .fillColor(rectangle.fillColor)
            .borderColor(rectangle.borderColor)
            .borderWidth(this.normalizePixel(rectangle.borderWidth))
            .dimension(this.normalizeDimension(rectangle.dimension))
            .position(this.normalizePosition(rectangle.position))
            .build();
    }

    /**
     * Rescales the given {@code rectangle} to the current scale of the viewer.
     *
     * @param {Rectangle} rectangle - the rectangle to rescale
     *
     * @returns {Rectangle} the rescaled rectangle
     */
    rescaleRectangle(rectangle: Rectangle): Rectangle {

        this.log.trace(() => `Rescale rectangle element: rectangleId=${rectangle.id}`);
        this.log.debug(() => `Rescale with current scale: scale=${this.viewer.currentScale}, rectangle=${JSON.stringify(rectangle)}`);

        return new ElementBuilderFactoryImpl().rectangle()
            .id(rectangle.id)
            .fillColor(rectangle.fillColor)
            .borderColor(rectangle.borderColor)
            .borderWidth(this.rescalePixel(rectangle.borderWidth))
            .dimension(this.rescaleDimension(rectangle.dimension))
            .position(this.rescalePosition(rectangle.position))
            .build();
    }

    /**
     * Normalized the given {@code ellipse} to the scale of 1.
     *
     * @param {Ellipse} ellipse - the ellipse to normalize in scale
     *
     * @returns {Ellipse} the normalized ellipse
     */
    normalizeEllipse(ellipse: Ellipse): Ellipse {

        this.log.trace(() => `Normalize ellipse element: ellipseId=${ellipse.id}`);
        this.log.debug(() => `Normalize with current scale: scale=${this.viewer.currentScale}, ellipse=${JSON.stringify(ellipse)}`);

        return new ElementBuilderFactoryImpl().ellipse()
            .id(ellipse.id)
            .fillColor(ellipse.fillColor)
            .borderColor(ellipse.borderColor)
            .borderWidth(this.normalizePixel(ellipse.borderWidth))
            .dimension(this.normalizeDimension(ellipse.dimension))
            .position(this.normalizePosition(ellipse.position))
            .build();
    }

    /**
     * Rescales the given {@code ellipse} to the current scale of the viewer.
     *
     * @param {Ellipse} ellipse - the ellipse to rescale
     *
     * @returns {Ellipse} the rescaled ellipse
     */
    rescaleEllipse(ellipse: Rectangle): Ellipse {

        this.log.trace(() => `Rescale ellipse element: ellipseId=${ellipse.id}`);
        this.log.debug(() => `Rescale with current scale: scale=${this.viewer.currentScale}, ellipse=${JSON.stringify(ellipse)}`);

        return new ElementBuilderFactoryImpl().rectangle()
            .id(ellipse.id)
            .fillColor(ellipse.fillColor)
            .borderColor(ellipse.borderColor)
            .borderWidth(this.rescalePixel(ellipse.borderWidth))
            .dimension(this.rescaleDimension(ellipse.dimension))
            .position(this.rescalePosition(ellipse.position))
            .build();
    }

    /**
     * Normalized the given {@code circle} to the scale of 1.
     *
     * @param {Circle} circle - the circle to normalize in scale
     *
     * @returns {Circle} the normalized circle
     */
    normalizeCircle(circle: Circle): Circle {

        this.log.trace(() => `Normalize circle element: circleId=${circle.id}`);
        this.log.debug(() => `Normalize with current scale: scale=${this.viewer.currentScale}, circle=${JSON.stringify(circle)}`);

        return new ElementBuilderFactoryImpl().circle()
            .id(circle.id)
            .fillColor(circle.fillColor)
            .borderColor(circle.borderColor)
            .borderWidth(this.normalizePixel(circle.borderWidth))
            .diameter(this.normalizePixel(circle.diameter))
            .position(this.normalizePosition(circle.position))
            .build();
    }

    /**
     * Rescales the given {@code circle} to the current scale of the viewer.
     *
     * @param {Circle} circle - the circle to rescale
     *
     * @returns {Circle} the rescaled circle
     */
    rescaleCircle(circle: Circle): Circle {

        this.log.trace(() => `Rescale circle element: circleId=${circle.id}`);
        this.log.debug(() => `Rescale with current scale: scale=${this.viewer.currentScale}, circle=${JSON.stringify(circle)}`);

        return new ElementBuilderFactoryImpl().circle()
            .id(circle.id)
            .fillColor(circle.fillColor)
            .borderColor(circle.borderColor)
            .borderWidth(this.rescalePixel(circle.borderWidth))
            .diameter(this.rescalePixel(circle.diameter))
            .position(this.rescalePosition(circle.position))
            .build();
    }

    /**
     * Normalized the given {@code line} to the scale of 1.
     *
     * @param {Line} line - the line to normalize in scale
     *
     * @returns {Line} the normalized line
     */
    normalizeLine(line: Line): Line {

        this.log.trace(() => `Normalize line element: lineId=${line.id}`);
        this.log.debug(() => `Normalize with current scale: scale=${this.viewer.currentScale}, line=${JSON.stringify(line)}`);

        return new ElementBuilderFactoryImpl().line()
            .id(line.id)
            .borderColor(line.borderColor)
            .borderWidth(this.normalizePixel(line.borderWidth))
            .start(this.normalizePosition(line.start))
            .end(this.normalizePosition(line.end))
            .build();
    }

    /**
     * Rescales the given {@code line} to the current scale of the viewer.
     *
     * @param {Line} line - the line to rescale
     *
     * @returns {Line} the rescaled line
     */
    rescaleLine(line: Line): Line {

        this.log.trace(() => `Rescale line element: lineId=${line.id}`);
        this.log.debug(() => `Rescale with current scale: scale=${this.viewer.currentScale}, line=${JSON.stringify(line)}`);

        return new ElementBuilderFactoryImpl().line()
            .id(line.id)
            .borderColor(line.borderColor)
            .borderWidth(this.rescalePixel(line.borderWidth))
            .start(this.rescalePosition(line.start))
            .end(this.rescalePosition(line.end))
            .build();
    }

    /**
     * Normalize the border width to a scale of one.
     * For example:
     * Rendered:        1.6px
     * Document scale:  1.6
     * Normal width:    1px
     *
     * @param {number} px   The pixel which should get normalized.
     *
     * @return {number} The normalized value at a scale of one.
     */
    normalizePixel(px: number): number {
        return px / this.viewer.currentScale;
    }

    /**
     * Rescale a normalized value to fit the current document scale.
     * For example:
     * Normal width:    1px
     * Document scale:  1.6
     * Rendered:        1.6px
     *
     * @param {number} px   The pixel which should get rescaled.
     *
     * @return {number}     The rescaled value according to the document scale.
     */
    rescalePixel(px: number): number {
        return px * this.viewer.currentScale;
    }

    private normalizeDimension(dimension: Dimension): Dimension {
        return {
            height: this.normalizePixel(dimension.height),
            width:  this.normalizePixel(dimension.width)
        };
    }

    private rescaleDimension(dimension: Dimension): Dimension {
        return {
            height: this.rescalePixel(dimension.height),
            width: this.rescalePixel(dimension.width)
        };
    }

    private normalizePosition(position: Point): Point {
        return {
            x: this.normalizePixel(position.x),
            y: this.normalizePixel(position.y)
        };
    }

    private rescalePosition(position: Point): Point {
        return {
            x: this.rescalePixel(position.x),
            y: this.rescalePixel(position.y)
        };
    }
}
