import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { fromEvent, merge, Subject } from "rxjs";
import { bufferCount, filter, map, takeUntil, tap } from "rxjs/operators";
import { Logger } from "typescript-logging";
import { DoubleTapZoomingInteraction } from "../../api/zoom/interaction";
import { LoggerFactory } from "../../log-config";
import { DocumentModel } from "../document.model";

export class DoubleTapZoomingInteractionImpl implements DoubleTapZoomingInteraction {

    private readonly dispose$: Subject<void> = new Subject<void>();
    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/zoomt/double-tap-zoom:DoubleTapZoomingInteractionImpl");

    private isEnabled: boolean = false;
    private gestureDelta: number = 500;
    private documentZoomFactor: number = 1.2;

    get enabled(): boolean {
        return this.isEnabled;
    }

    set enabled(value: boolean) {
        if (value === this.isEnabled) {
            return;
        }

        this.isEnabled = value;
        this.log.debug(`Double Tap enabled: ${this.isEnabled}`);
        if (this.isEnabled) {
            this.listenForGesture();
            return;
        }

        this.stopListeningForGesture();
    }

    get maxDoubleTapDelta(): number {
        return this.gestureDelta;
    }

    set maxDoubleTapDelta(value: number) {
        this.gestureDelta = Math.ceil(value);
        this.log.trace(`New double tap gesture delta: ${this.gestureDelta}`);
    }

    get zoomFactor(): number {
        return this.documentZoomFactor;
    }

    set zoomFactor(value: number) {
        if (value <= 10 && value >= 1.01) {
            this.documentZoomFactor = value;
            this.log.trace(`New double tap zoom factor: ${this.documentZoomFactor}`);
            return;
        }

        this.log.warn(`Double tap zoom factor ignored! Expected min: 1.01 max: 10 given: ${value}`);
    }

    constructor(private readonly viewer: PDFViewer, private readonly container: DocumentModel) {
    }

    toggle(): void {
        this.enabled = !this.enabled;
    }

    dispose(): void {
        this.enabled = false;
        this.dispose$.next();
        this.dispose$.complete();
    }

    private listenForGesture(): void {

        // Actual zoom logic
        let previousScale: number = 0;
        let latestKnownScale: number = this.viewer.currentScale;
        merge(
            fromEvent<MouseEvent>(
                this.container.viewer,
                "click", {passive: true}),
            fromEvent<TouchEvent>(
                this.container.viewer,
                "touch", {passive: true})
        ).pipe(
            filter((it) => "touches" in it ? it.touches.length === 1 : true),
            map((it) => it.timeStamp),
            bufferCount(2, 1),
            tap((it) => this.log.trace(`Touch interval 1: ${it[0]}, 2: ${it[1]} diff: ${it[1] - it[0]} delta: ${this.gestureDelta}`)),
            filter((it) => (it[1] - it[0]) <= this.gestureDelta),
            map(() => undefined),
            takeUntil(this.dispose$)
        ).subscribe(() => {
            this.log.debug("Double tap detected.");
            if (latestKnownScale === this.viewer.currentScale && previousScale !== 0) {
                this.viewer.currentScale = previousScale;
                this.log.trace(`Double tap zoom out to previous scale: ${previousScale}`);
                previousScale = 0;
                latestKnownScale = this.viewer.currentScale;
                return;
            }

            previousScale = this.viewer.currentScale;
            this.viewer.currentScale *= this.documentZoomFactor;
            latestKnownScale = this.viewer.currentScale;
            this.log.trace(`Double tap zoom in to: ${latestKnownScale}`);
        });
    }


    private stopListeningForGesture(): void {
        this.dispose$.next();
    }
}
