import { PDFViewer } from "pdfjs-dist/web/pdf_viewer";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { DoubleTabInteractions, GlobalZoomConfiguration, ZoomingInteractions, ZoomSettings } from "../../api/zoom";
import { DocumentModel } from "../document.model";
import { DoubleTapSnapInteractionImpl } from "./double-tap-snap";
import { DoubleTapZoomingInteractionImpl } from "./double-tap-zoom";
import { DefaultGlobalZoomConfiguration } from "./global-zoom-config";
import { PinchZoomingInteraction } from "./pinch-zoom";

export class DefaultZoomSettings implements ZoomSettings {

    readonly config: DefaultGlobalZoomConfiguration;
    readonly gesture: DefaultZoomInteractions;

    constructor(viewer: PDFViewer, container: DocumentModel) {
        this.config = new DefaultGlobalZoomConfiguration();
        this.gesture = new DefaultZoomInteractions(viewer, container, this.config);
    }

    dispose(): void {
        this.gesture.dispose();
    }

}

class DefaultZoomInteractions implements ZoomingInteractions {
    private readonly dispose$: Subject<void> = new Subject<void>();

    readonly pinch: PinchZoomingInteraction;
    readonly doubleTap: DefaultDoubleTapInteractions;

    constructor(viewer: PDFViewer, container: DocumentModel, config: GlobalZoomConfiguration) {
        const zoom: DoubleTapZoomingInteractionImpl = new DoubleTapZoomingInteractionImpl(viewer, config, container);
        const snap: DoubleTapSnapInteractionImpl = new DoubleTapSnapInteractionImpl(viewer, container);
        this.pinch = new PinchZoomingInteraction(viewer, container, config);
        this.doubleTap = new DefaultDoubleTapInteractions(
            zoom,
            snap
        );

        zoom.stateChange
            .pipe(
                filter((it) => it.isActive),
                takeUntil(this.dispose$)
            )
            .subscribe(() => snap.enabled = false);

        snap.stateChange
            .pipe(
                filter((it) => it.isActive),
                takeUntil(this.dispose$)
            )
            .subscribe(() => zoom.enabled = false);
    }

    dispose(): void {
        this.pinch.dispose();
        this.doubleTap.dispose();

        this.dispose$.next();
        this.dispose$.complete();
    }
}

class DefaultDoubleTapInteractions implements DoubleTabInteractions {

    constructor(
        readonly zoom: DoubleTapZoomingInteractionImpl,
        readonly snap: DoubleTapSnapInteractionImpl
    ) { }

    dispose(): void {
        this.zoom.dispose();
        this.snap.dispose();
    }
}
