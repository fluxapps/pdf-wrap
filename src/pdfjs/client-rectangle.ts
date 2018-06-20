import {Logger} from "typescript-logging";
import {LoggerFactory} from "../log-config";


/**
 * Specific class for {@link ClientRect} which provides intersection calculation of two {@code ClientRectangles}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class ClientRectangle implements ClientRect {

    /**
     * Creates a {@code ClientRectangle} based on the coordinates.
     *
     * The coordinates are relative to the top left corner of a coordinate system.
     *
     * @param {number} left - distance of the left side of the rectangle
     * @param {number} right - distance of the right side of the rectangle
     * @param {number} top - distance of the top side of the rectangle
     * @param {number} bottom - distance of the bottom side of a rectangle
     *
     * @returns {ClientRectangle} the resulting client rectangle
     */
    static fromCoordinates(left: number, right: number, top: number, bottom: number): ClientRectangle {
        return new ClientRectangle(left, right, top, bottom, bottom - top, right - left);
    }

    /**
     * Creates a {@code ClientRectangle} based on the top and left coordinates combined with the height and width.
     *
     * The coordinates are relative to the top left corner of a coordinate system
     *
     * @param {number} top - distance of the top side of a rectangle
     * @param {number} left - distance of the left side of a rectangle
     * @param {number} height - the height of the rectangle
     * @param {number} width - the width of the rectangle
     *
     * @returns {ClientRectangle} the resulting rectangle
     */
    static fromSize(top: number, left: number, height: number, width: number): ClientRectangle {
        return new ClientRectangle(left, left + width, top, top + height, height, width);
    }

    /**
     * Creates a {@code ClientRectangle} based on a {@link ClientRect}.
     *
     * @param {ClientRect} clientRect - the client rect to wrap
     *
     * @returns {ClientRectangle} the resulting rectangle
     */
    static from(clientRect: ClientRect): ClientRectangle {
        return new ClientRectangle(
            clientRect.left,
            clientRect.right,
            clientRect.top,
            clientRect.bottom,
            clientRect.height,
            clientRect.width);
    }

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/client-rectangle:ClientRectangle");

    private constructor(
        readonly left: number,
        readonly right: number,
        readonly top: number,
        readonly bottom: number,
        readonly height: number,
        readonly width: number
    ) {}

    /**
     * Checks if this client rectangle has an intersection with the {@code other} client rect.
     *
     * @param {ClientRect} other - the other client rect to check
     * @param {() => boolean} condition - if false, the check will not be performed and false will be returned
     *
     * @returns {boolean} true if an intersection is occurred, otherwise false
     */
    isIntersectedWith(other: ClientRect, condition: () => boolean = (): boolean => true): boolean {
        return condition() && this.intersectionAreaOf(other) > 0;
    }

    /**
     * Calculates the area of the intersection of this client rectangle and the {@code other} client rect.
     *
     * If there is no intersection at all, 0 as the intersection area will be returned.
     *
     * @param {ClientRect} other - the other client rect to calculate the intersection
     * @param {() => boolean} condition - if false, 0 as the intersection area will be returned
     *
     * @returns {number} the area of the intersection, or 0 if there is no intersection
     */
    intersectionAreaOf(other: ClientRect, condition: () => boolean = (): boolean => true): number {

        if (!condition()) {
            return 0;
        }

        const overlapWidth: number = Math.max(0, this.overlapRight(other) - this.overlapLeft(other));
        const overlapHeight: number = Math.max(0, this.overlapBottom(other) - this.overlapTop(other));

        return overlapWidth * overlapHeight;
    }

    /**
     * Calculates the area of the intersection of this client rectangle and the {@code other} client rect
     * and returns the intersection as a {@code ClientRectangle}.
     *
     * If there is no intersection at all, an {@link Error} will be thrown, indicating that there is no intersection.
     *
     * @param {ClientRect} other - the other client rect to compare
     *
     * @returns {ClientRectangle} the resulting client rectangle
     * @throws {Error} if no intersection is occurred
     */
    intersectionOf(other: ClientRect): ClientRectangle {

        if (this.isIntersectedWith(other)) {

            return ClientRectangle.fromCoordinates(
                this.overlapLeft(other),
                this.overlapRight(other),
                this.overlapTop(other),
                this.overlapBottom(other));
        }

        throw new Error("No intersection between the two client rectangles exists");
    }

    /**
     * Calculates the percentage ratio of the intersection of this client rectangle and the {@code other} client rect,
     * compared to this client rectangles area
     *
     * If there is no intersection at all, 0 as the percentage value will be returned.
     *
     * Percentage value:
     * 1 in case of a perfect overlap, down to 0
     *
     * @param {ClientRect} other - the other client rect to compare
     * @param {() => boolean} condition - if false, 0 as the percentage value will be returned
     *
     * @returns {number} the percentage value from 1 down to 0
     */
    percentageIntersectionOf(other: ClientRect, condition: () => boolean = (): boolean => true): number {
        return this.intersectionAreaOf(other, condition) / this.area();
    }

    /**
     * Unites this client rectangle wtih the given {@code other} client rectangle.
     *
     * The {@code top} and {@code bottom} attributes must be the equal to the
     * {@code top} and {@code bottom} attributes of the {@code other} rectangle.
     *
     * @param {ClientRectangle} other - the rectangle to unite with
     *
     * @returns {ClientRectangle} the united rectangle
     * @throws {Error} if the {@code top} and {@code bottom} attributes do not match
     */
    unite(other: ClientRectangle): ClientRectangle {

        this.log.trace(`Unite client rectangles:\n${JSON.stringify(this)}\n${JSON.stringify(other)}`);

        if (!this.isIntersectedWith(other)) {
            throw new Error("Can not unite client rectangles with no intersection:"
            + `\n${JSON.stringify(this)}\n${JSON.stringify(other)}`);
        }

        if (this.top !== other.top || this.bottom !== other.bottom) {
            throw new Error("Can not unite client rectangles with uneven top or bottom attributes:"
            + `\n${JSON.stringify(this)}\n${JSON.stringify(other)}`);
        }

        return ClientRectangle.fromCoordinates(
            Math.min(this.left, other.left),
            Math.max(this.right, other.right),
            this.top,
            this.bottom
        );
    }

    /**
     * Subtracts the {@code other} rectangle from this rectangle
     * and returns the result as a new {@code ClientRectangle} collection.
     *
     * The {@code top} and {@code bottom} attributes must be the equal to the
     * {@code top} and {@code bottom} attributes of the {@code other} rectangle.
     *
     * @param {ClientRectangle} other - the rectangle to subtract from this rectangle
     *
     * @returns {Array<ClientRectangle>} a collection of the new rectangles, may be 0, 1 or 2
     * @throws {Error} if the {@code top} and {@code bottom} attributes do not match
     */
    subtract(other: ClientRectangle): Array<ClientRectangle> {

        this.log.trace(`Subtract client rectangles:\n ${JSON.stringify(this)}\n-${JSON.stringify(other)}`);

        if (this.top !== other.top || this.bottom !== other.bottom) {
            throw new Error("Can not subtract rectangle with uneven top or bottom attributes:"
            + `\n${JSON.stringify(this)}\n${JSON.stringify(other)}`);
        }

        if (!this.isIntersectedWith(other)) {
            return [this];
        }

        const result: Array<ClientRectangle> = [];

        if (this.left < other.left) {
            result.push(
                ClientRectangle.fromCoordinates(
                    this.left,
                    other.left,
                    this.top,
                    this.bottom
                ),
            );
        }

        if (this.right > other.right) {
            result.push(
                ClientRectangle.fromCoordinates(
                    other.right,
                    this.right,
                    this.top,
                    this.bottom
                ),
            );
        }

        return result;
    }

    /**
     * @returns {number} the area of this client rectangle
     */
    area(): number {
        return this.height * this.width;
    }

    private overlapLeft(other: ClientRect): number {
        return Math.max(0, Math.max(this.left, other.left));
    }

    private overlapRight(other: ClientRect): number {
        return Math.max(0, Math.min(this.right, other.right));
    }

    private overlapTop(other: ClientRect): number {
        return Math.max(0, Math.max(this.top, other.top));
    }

    private overlapBottom(other: ClientRect): number {
        return Math.max(0, Math.min(this.bottom, other.bottom));
    }
}
