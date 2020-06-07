import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { Observable } from "rxjs";
import { Logger } from "typescript-logging";
import { Optional } from "typescript-optional";
import { DoubleTapZoomingInteraction } from "../../api/zoom";
import { LoggerFactory } from "../../log-config";
import { DocumentModel, Page } from "../document.model";
import { AbstractDoubleTapInteraction } from "./interaction-base";

export class DoubleTapZoomingInteractionImpl extends AbstractDoubleTapInteraction implements DoubleTapZoomingInteraction {

    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoomt/double-tap-zoom:DoubleTapZoomingInteractionImpl");
    #documentZoomFactor: number = 1.2;

    get zoomFactor(): number {
        return this.#documentZoomFactor;
    }

    set zoomFactor(value: number) {
        if (value <= 10 && value >= 1.01) {
            this.#documentZoomFactor = value;
            this.#log.trace(`New double tap zoom factor: ${this.#documentZoomFactor}`);
            return;
        }

        this.#log.warn(`Double tap zoom factor ignored! Expected min: 1.01 max: 10 given: ${value}`);
    }

    constructor(private readonly viewer: PDFViewer, container: DocumentModel) {
        super(container);
    }

    protected listenForGesture(events: Observable<Optional<Page>>): void {
        // Actual zoom logic
        let previousScale: number = 0;
        let latestKnownScale: number = this.viewer.currentScale;
        events.subscribe(() => {
            this.#log.debug("Double tap zoom gesture detected.");
            if (latestKnownScale === this.viewer.currentScale && previousScale !== 0) {
                this.viewer.currentScale = previousScale;
                this.#log.trace(`Double tap zoom out to previous scale: ${previousScale}`);
                previousScale = 0;
                latestKnownScale = this.viewer.currentScale;
                return;
            }

            previousScale = this.viewer.currentScale;
            this.viewer.currentScale *= this.#documentZoomFactor;
            latestKnownScale = this.viewer.currentScale;
            this.#log.trace(`Double tap zoom in to: ${latestKnownScale}`);
        });
    }

    dispose(): void {
        super.dispose();
    }
}
