import {PolyLine, Rectangle} from "../api/draw/elements";
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
            .borderWidth(this.normalizeBorderWidth(polyLine.borderWidth))
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
            .borderWidth(this.rescaleBorderWidth(polyLine.borderWidth))
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
            .borderWidth(this.normalizeBorderWidth(rectangle.borderWidth))
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
            .borderWidth(this.rescaleBorderWidth(rectangle.borderWidth))
            .dimension(this.rescaleDimension(rectangle.dimension))
            .position(this.rescalePosition(rectangle.position))
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
    normalizeBorderWidth(px: number): number {
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
    rescaleBorderWidth(px: number): number {
        return px * this.viewer.currentScale;
    }

    private normalizeDimension(dimension: Dimension): Dimension {
        return {
            height: dimension.height / this.viewer.currentScale,
            width: dimension.width / this.viewer.currentScale
        };
    }

    private rescaleDimension(dimension: Dimension): Dimension {
        return {
            height: dimension.height * this.viewer.currentScale,
            width: dimension.width * this.viewer.currentScale
        };
    }

    private normalizePosition(position: Point): Point {
        return {
            x: position.x / this.viewer.currentScale,
            y: position.y / this.viewer.currentScale
        };
    }

    private rescalePosition(position: Point): Point {
        return {
            x: position.x * this.viewer.currentScale,
            y: position.y * this.viewer.currentScale
        };
    }
}
