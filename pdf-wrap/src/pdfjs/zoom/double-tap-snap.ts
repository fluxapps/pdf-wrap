import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { Observable } from "rxjs";
import { Logger } from "typescript-logging";
import { Optional } from "typescript-optional";
import { ScalePreset } from "../../api/document";
import { DoubleTapSnapInteraction } from "../../api/zoom";
import { LoggerFactory } from "../../log-config";
import { DocumentModel, Page } from "../document.model";
import { AbstractDoubleTapInteraction } from "./interaction-base";

export class DoubleTapSnapInteractionImpl extends AbstractDoubleTapInteraction implements DoubleTapSnapInteraction {

    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoomt/double-tap-zoom:DoubleTapSnapInteractionImpl");
    #scale: ScalePreset = ScalePreset.AUTO;

    get scaleTo(): ScalePreset {
        return this.#scale;
    }

    set scaleTo(value: ScalePreset) {
        switch (value) {
            case ScalePreset.PAGE_WIDTH:
            case ScalePreset.PAGE_HIGHT:
            case ScalePreset.PAGE_FIT:
            case ScalePreset.ACTUAL:
            case ScalePreset.AUTO:
                this.#scale = value;
                break;
            default:
                throw new TypeError(`Unexpected value provided: "${value}"`);
        }

        this.#log.trace(`New double tap snap scale: ${this.#scale}`);
    }

    constructor(private readonly viewer: PDFViewer, container: DocumentModel) {
        super(container);
    }

    protected listenForGesture(events: Observable<Optional<Page>>): void {
        events.subscribe((it) => {
            this.#log.debug("Double tap snap gesture detected.");
            const pageNumber: number = it.map((page) => page.pageNumber).orElse(this.viewer.currentPageNumber);
            this.#log.trace(`Snap page: ${pageNumber}, to scale: "${this.#scale}"`);
            this.viewer.currentScaleValue = this.#scale;
            this.viewer.currentPageNumber = pageNumber;
        });
    }

    dispose(): void {
        super.dispose();
    }
}
