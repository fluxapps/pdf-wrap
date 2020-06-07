import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { Logger } from "typescript-logging";
import { LoggerFactory } from "../../log-config";
import { DocumentModel } from "../document.model";
import { AbstractZoomingInteraction } from "./interaction-base";

export class PinchZoomingInteraction extends AbstractZoomingInteraction {

    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoomt/pinch-zoom:PinchZoomingInteraction");

    /**
     * Pinch center X
     */
    #startX: number = 0;
    /**
     * Pinch center Y
     */
    #startY: number = 0;

    /**
     * Transform origin X axis
     */
    #originX: number = 0;

    /**
     * Transform origin Y axis
     */
    #originY: number = 0;

    /**
     * Initial pinch distance
     * used to calculate the pinch scale factor.
     */
    #initialPinchDistance: number = 0;
    /**
     * Zoom factor
     * Example:
     * Current rendering scale of pdf 0.5
     * Pinch distance start to end is factor 3 (end / start)
     * New pdf scaling is 0.5 * 3 = 1.5.
     */
    #pinchScale: number = 1;

    #unsubscribe: (() => void) | null = null;


    constructor(private readonly viewer: PDFViewer, private readonly container: DocumentModel) {
        super();
    }

    protected startListenForGesture(): void {
        const container: HTMLElement = this.container.viewer;
        const viewer: HTMLElement | null | undefined = (container?.firstElementChild as (HTMLElement | null | undefined));

        if (viewer === null || viewer === undefined) {
            this.#log.error(
                "Can't bind to viewer or container DOM! The elements '#viewerContainer' and '#viewerContainer > .pdfViewer' are not present."
            );
            return;
        }

        // Block ios page zoom
        const touchMoveDocumentHandler: (e: TouchEvent) => void = (e: TouchEvent): void => {
            if (e.scale !== undefined && e.scale !== 1) {
                e.preventDefault();
            }
        };
        const touchMoveViewerHandler: (e: TouchEvent) => void = (e: TouchEvent): void => {
            if (this.#initialPinchDistance <= 0 || e.touches.length < 2) {
                return;
            }

            const pinchDistance: number = Math.hypot((e.touches[1].pageX - e.touches[0].pageX), (e.touches[1].pageY - e.touches[0].pageY));
            const rect: DOMRect = container.getBoundingClientRect();
            this.#pinchScale = pinchDistance / this.#initialPinchDistance;
            const originX: number = ((this.#startX - rect.x) + container.scrollLeft);
            const originY: number = ((this.#startY - rect.y) + container.scrollTop);

            this.#log.trace(`PinchDistance: ${pinchDistance}, PinchScale: ${this.#pinchScale}`);
            this.#log.trace(`OriginX: ${originX}, OriginY: ${originY}`);

            viewer.style.transform = `scale(${this.#pinchScale})`;
            viewer.style.transformOrigin = `${originX}px ${originY}px`;
            this.#originX = originX;
            this.#originY = originY;
        };
        const touchStartViewerHandler: (e: TouchEvent) => void = (e: TouchEvent): void => {
            if (e.touches.length > 1) {
                this.#startX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                this.#startY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
                this.#initialPinchDistance = Math.hypot((e.touches[1].pageX - e.touches[0].pageX), (e.touches[1].pageY - e.touches[0].pageY));
            } else {
                this.#initialPinchDistance = 0;
            }
        };
        const touchEndViewerHandler: (e: TouchEvent) => void = (_: TouchEvent): void => {
            if (this.#initialPinchDistance <= 0) {
                this.reset();
                return;
            }

            // undo transform
            viewer.style.transform = `none`;
            viewer.style.transformOrigin = `unset`;

            // scale pdf to new zoom size
            this.#log.trace(`Old pdf scaling: ${this.viewer.currentScale}`);
            this.viewer.currentScale *= this.#pinchScale;
            this.#log.debug(`New pdf scaling: ${this.viewer.currentScale}`);

            this.enabled = false;
            requestAnimationFrame(() => {
                this.scrollToPinchCenter();
                this.reset();
                this.enabled = true;
            });
        };

        // Prevent native iOS page zoom
        document.addEventListener("touchmove", touchMoveDocumentHandler, {passive: false});
        viewer.addEventListener("touchstart", touchStartViewerHandler);
        viewer.addEventListener("touchmove", touchMoveViewerHandler);
        viewer.addEventListener("touchend", touchEndViewerHandler);

        this.#unsubscribe = (): void => {
            document.removeEventListener("touchmove", touchMoveDocumentHandler);
            viewer.removeEventListener("touchstart", touchStartViewerHandler);
            viewer.removeEventListener("touchmove", touchMoveViewerHandler);
            viewer.removeEventListener("touchend", touchEndViewerHandler);
            this.#unsubscribe = null;
        };
    }

    private getContainer(): HTMLElement {
        return  this.container.viewer;
    }

    /*
    private getViewer(): HTMLElement {
        const viewer: HTMLElement | null | undefined = (this.getContainer()?.firstElementChild as (HTMLElement | null | undefined));

        if (viewer === null || viewer === undefined) {
            const errMessage: string = "Can't bind to viewer or container DOM! Failed to initialize pinch zoom.";
            this.#log.error(errMessage);
            throw new Error(errMessage);
        }

        return viewer;
    }
     */

    private scrollToPinchCenter(): void {
        /*
            Source: https://www.math10.com/en/geometry/analytic-geometry/geometry1/coordinates-transformation.html
            where (x, y) are old coordinates [i.e. coordinates relative to xy system],
            (xp,yp) are new coordinates [relative to xp yp system] and (x0, y0) are the coordinates of the new origin 0'
            relative to the old xy coordinate system.
         */

        const container: HTMLElement = this.getContainer();
        // const viewer: Element = this.getViewer();

        // const vrect: DOMRect = viewer.getBoundingClientRect();
        const crect: DOMRect = container.getBoundingClientRect();

        // Translate the origin coordinates the screen coordinates
        // const x0: number = -vrect.x;
        // const y0: number = -vrect.y;

        // Scale the origin of the old rectangle to match the scaled rectangle "vrect"
        const x: number = (this.#originX * this.#pinchScale);
        const y: number = (this.#originY * this.#pinchScale);

        // The translated coordinates (screen X, screen Y)
        // const xp: number = x - x0;
        // const yp: number = y - y0;

        // Calculate delta of the pinch center and the side of the container.
        // This is required because we would scroll the pinch center to the container left  and top position without the delta.
        const dx: number = this.#startX - crect.x;
        const dy: number = this.#startY - crect.y;

        // scroll to startX
        const scrollLeft: number = (x - dx);

        // scroll to startY
        const scrollTop: number = (y - dy);

        container.scrollLeft = scrollLeft;
        container.scrollTop = scrollTop;

    }

    protected stopListeningForGesture(): void {
        if (typeof this.#unsubscribe === "function") {
            this.#unsubscribe();
        }
    }

    private reset(): void {
        this.#startX = this.#startY = this.#initialPinchDistance = 0;
        this.#pinchScale = 1;
    }

    dispose(): void {
        super.dispose();
    }
}
