import { DoubleTabInteractions, ZoomingInteraction } from "./interaction";

/**
 * Zoom settings of the current pdf document.
 */
export interface ZoomSettings {
    /**
     * Pinch zoom interaction settings.
     */
    readonly pinch: ZoomingInteraction;
    /**
     * Double tap interaction settings.
     */
    readonly doubleTap: DoubleTabInteractions;
}
