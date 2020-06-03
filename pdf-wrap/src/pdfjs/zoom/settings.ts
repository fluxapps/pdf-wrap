import { DoubleTapZoomingInteractionImpl } from "./double-tap-zoom";
import { PinchZoomingInteraction } from "./pinch-zoom";

export class DefaultZoomSettings {
    constructor(readonly pinch: PinchZoomingInteraction, readonly doubleTap: DoubleTapZoomingInteractionImpl) {
    }

    dispose(): void {
        this.pinch.dispose();
        this.doubleTap.dispose();
    }
}
