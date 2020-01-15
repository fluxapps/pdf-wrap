
import {Point} from "../api/draw/draw.basic";
import {LoggerFactory} from "../log-config";
import {Logger} from "typescript-logging";
import { from } from "rxjs";
import {bufferCount, filter, map} from "rxjs/operators";

/**
 * Specific class for lines which provides intersection calculation of two {@code ClientLine}.
 *
 * @author Nicolas Schäfli <ns@studer-raimann.ch>
 * @since 0.2.0
 * @internal
 */
export class ClientLine {

    /**
     * If X is parallel to the Y axis, the slope is undefined (NaN) because
     * division by zero is not possible.
     */
    readonly m: number;
    readonly b: number;

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/client-line:ClientLine");

    constructor(
        readonly start: Point,
        readonly end: Point
    ) {

        this.m = this.start.x !== this.end.x ? (this.end.y - this.start.y) / (this.end.x - this.start.x) : Number.NaN;
        this.b = this.end.y - (this.m * this.end.x);

    }

    /**
     * Checks if the the two lines intersect with each other.
     *
     * Exceptions:
     * If ax1 and ax2 or bx1 or bx2 are equal the lines never intersect.
     *
     * @param {ClientLine} line The line which should be used to for the intersection check.
     * @return {boolean} True if the two lines intersect with each other, otherwise false.
     */
    intersectsWith(line: ClientLine): boolean {

        // If they have the same slope they are parallel to each other.
        if (this.m === line.m) {
            return false;
        }

        // If one of the slopes is undefined the two lines never intersect.
        if (isNaN(this.m) || isNaN(line.m)) {
            return false;
        }

        // calculate the intersection coordinate.
        const collisionX: number = (line.b - this.b) / (this.m - line.m);
        const collisionY: number = ((this.m * (line.b - this.b)) / (this.m - line.m)) + this.b;

        // check if the collision is between the start and end of the line.
        const hasIntersection: boolean =
            Math.min(line.start.x, line.end.x) <= collisionX && collisionX <= Math.max(line.start.x, line.end.x)
        &&  Math.min(line.start.y, line.end.y) <= collisionY && collisionY <= Math.max(line.start.y, line.end.y)
        &&  Math.min(this.start.x, this.end.x) <= collisionX && collisionX <= Math.max(this.start.x, this.end.x)
        &&  Math.min(this.start.y, this.end.y) <= collisionY && collisionY <= Math.max(this.start.y, this.end.y);

        if (hasIntersection) {
            this.log.debug(() => `Theoretical intersection point: x: ${collisionX} y: ${collisionY}`);
            this.log.debug(() => `ax1: ${this.start.x} ay1: ${this.start.y} ax2: ${this.end.x} ay2: ${this.end.y} m: ${this.m} b: ${this.b}`);
            this.log.debug(() => `bx1: ${line.start.x} by1: ${line.start.y} bx2: ${line.end.x} by2: ${line.end.y} m: ${line.m} b: ${line.b}`);
        }

        return hasIntersection;
    }
}

/**
 * Specific class to calculate collisions between a {ClientLine} and
 * a polyline.
 *
 * @author Nicolas Schäfli <ns@studer-raimann.ch>
 * @since 0.2.0
 * @internal
 */
export class ClientPolyline {

    private readonly lines: Array<ClientLine> = [];

    constructor(points: Array<Point>) {

        // There are no async operations therefore no need to await the end of the operation.
        from(points)
            .pipe(bufferCount(2, 1))
            .pipe(filter((it) => it.length === 2))          // Filter collections with less then two points
            .pipe(map((it) => new ClientLine(it[0], it[1])))
            .forEach((it) => this.lines.push(it));
    }

    /**
     * Checks if the given line collides with the polyline.
     *
     * @param {ClientLine} line The line which is used for the collision detection.
     * @return {boolean}        If the two lines collide, otherwise false.
     */
    intersectsWith(line: ClientLine): boolean {
        return this.lines.some((it) => it.intersectsWith(line));
    }


}
