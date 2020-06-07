import { Logger } from "typescript-logging";
import { GlobalZoomConfiguration } from "../../api/zoom";
import { LoggerFactory } from "../../log-config";

export class DefaultGlobalZoomConfiguration implements GlobalZoomConfiguration {

    readonly #log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoom/double-tap-zoom:DefaultGlobalZoomConfiguration");

    #maxScale: number = 11;
    #minScale: number = 0.1;

    get minScale(): number {
        return this.#minScale;
    }

    set minScale(value: number) {
        this.#minScale = value;
        this.#log.info(`New document min scale: ${value}`);
    }

    get maxScale(): number {
        return this.#maxScale;
    }

    set maxScale(value: number) {
        this.#maxScale = value;
        this.#log.info(`New document max scale: ${value}`);
    }
}
