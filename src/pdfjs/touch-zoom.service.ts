import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { Logger } from "typescript-logging";
import { LoggerFactory } from "../log-config";
import { DocumentModel } from "./document.model";

export interface TouchZoomService {
    pinchZoomEnabled: boolean;
}

export class DefaultTouchZoomService implements TouchZoomService {

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/touch-zoom-service:DefaultTouchZoomService");

    private isPinchZoomEnabled: boolean = false;

    private startX: number = 0;
    private startY: number = 0;
    private initialPinchDistance: number = 0;
    private pinchScale: number = 1;

    get pinchZoomEnabled(): boolean {
        return this.isPinchZoomEnabled;
    }

    set pinchZoomEnabled(value: boolean) {
        this.isPinchZoomEnabled = value;
        if (value) {
            this.enablePinchZoom();
        }
    }


    constructor(private readonly viewer: PDFViewer, private readonly container: DocumentModel) {
    }

    private enablePinchZoom(): void {
        const container: HTMLElement = this.container.viewer;
        const viewer: HTMLElement | null | undefined = (container?.firstElementChild as (HTMLElement | null | undefined));

        if (viewer === null || viewer === undefined) {
            this.log.error("Can't bind to viewer or container DOM! The elements '#viewerContainer' and '#viewerContainer > .pdfViewer' are not present.");
            return;
        }

        // Prevent native iOS page zoom
        document.addEventListener("touchmove", (e) => { if (e.scale !== undefined && e.scale !== 1) { e.preventDefault(); } }, { passive: false });
        viewer.addEventListener("touchstart", (e) => {
            if (e.touches.length > 1) {
                this.startX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                this.startY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
                this.initialPinchDistance = Math.hypot((e.touches[1].pageX - e.touches[0].pageX), (e.touches[1].pageY - e.touches[0].pageY));
            } else {
                this.initialPinchDistance = 0;
            }
        });

        viewer.addEventListener("touchmove", (e) => {
            if (this.initialPinchDistance <= 0 || e.touches.length < 2) { return; }

            const pinchDistance: number = Math.hypot((e.touches[1].pageX - e.touches[0].pageX), (e.touches[1].pageY - e.touches[0].pageY));
            const originX: number = this.startX + container.scrollLeft;
            const originY: number = this.startY + container.scrollTop;
            this.pinchScale = pinchDistance / this.initialPinchDistance;

            viewer.style.transform = `scale(${this.pinchScale})`;
            viewer.style.transformOrigin = `${originX}px ${originY}px`;
        });

        viewer.addEventListener("touchend", (_) => {
            if (this.initialPinchDistance <= 0) { return; }

            viewer.style.transform = `none`;
            viewer.style.transformOrigin = `unset`;

            this.viewer.currentScale *= this.pinchScale;
            const rect: DOMRect = container.getBoundingClientRect();
            const dx: number = this.startX - rect.left;
            const dy: number = this.startY - rect.top;
            container.scrollLeft += dx * (this.pinchScale - 1);
            container.scrollTop += dy * (this.pinchScale - 1);

            this.reset();
        });
    }

    private reset(): void {
        this.startX = this.startY = this.initialPinchDistance = 0; this.pinchScale = 1;
    }
}
