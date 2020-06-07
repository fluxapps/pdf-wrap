import { ZoomingInteractions } from "./interaction";

/**
 * Zoom settings of the current pdf document.
 */
export interface ZoomSettings {
    /**
     * Global zoom configuration which applies to
     * all zoom related document apis.
     */
    readonly config: GlobalZoomConfiguration;
    /**
     * Zoom gestures which can be triggered by a user interaction.
     */
    readonly gesture: ZoomingInteractions;
}

/**
 * Global Zoom Configuration which applies to all
 * Zoom related actions.
 *
 * - Pinch Zoom
 * - Double Tap Zoom
 * - Manual zoom via Document scale property
 */
export interface GlobalZoomConfiguration {
    /**
     * The minimum scale of the document.
     */
    minScale: number;
    /**
     * The maximum scale of the document.
     */
    maxScale: number;
}
