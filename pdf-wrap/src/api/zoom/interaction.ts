/**
 * A generic zoom interaction, which is triggered by a user
 * which interacts with the pdf document.
 */
export interface ZoomingInteraction {

    /**
     * Set the current state of the zoom interaction.
     * true     - Enables the interaction.
     * false    - Disables the interaction.
     */
    enabled: boolean;

    /**
     * Toggle the zoom interaction between enabled and disabled.
     */
    toggle(): void;
}

/**
 * A touch double tap interaction which zooms in and out of a pdf document.
 *
 * Behaviour:
 * If the user double taps the document, the interaction will increase the scale of the document.
 * After a second double tap the document scale will be restored.
 *
 * This interaction will not restore the original scale value if the user manipulates the value by other means (pinch etc.).
 *
 * Zooms page by 20%.
 */
export interface DoubleTapZoomingInteraction extends ZoomingInteraction {
    /**
     * The maximum time delta in ms between two taps,
     * which will trigger this interaction.
     *
     * Floating point values are rounded to the next bigger integer.
     *
     * Defaults to 500ms.
     */
    maxDoubleTapDelta: number;

    /**
     * The zoom factor of the double touch gesture.
     *
     * Defaults to 1.2 (120% of the current page scale value)
     *
     * Minimum value: 1.01
     * Maximum value: 10
     *
     * Invalid values are ignored.
     */
    zoomFactor: number;
}
