import {PolyLine, Rectangle} from "../api/draw/elements";
import {Dimension, Point} from "../api/draw/draw.basic";
import {PDFViewer} from "pdfjs-dist/web/pdf_viewer";
import {ElementBuilderFactoryImpl} from "../paint/element.builders.impl";

/**
 * Manages the scaling of elements. It can normalize elements based on the viewers
 * scale and rescale them from a normalized state to the viewers current scale.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class RescaleManager {

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
        return new ElementBuilderFactoryImpl().polyLine()
            .id(polyLine.id)
            .borderColor(polyLine.borderColor)
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
        return new ElementBuilderFactoryImpl().polyLine()
            .id(polyLine.id)
            .borderColor(polyLine.borderColor)
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
        return new ElementBuilderFactoryImpl().rectangle()
            .id(rectangle.id)
            .fillColor(rectangle.fillColor)
            .borderColor(rectangle.borderColor)
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
        return new ElementBuilderFactoryImpl().rectangle()
            .id(rectangle.id)
            .fillColor(rectangle.fillColor)
            .borderColor(rectangle.borderColor)
            .dimension(this.rescaleDimension(rectangle.dimension))
            .position(this.rescalePosition(rectangle.position))
            .build();
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
