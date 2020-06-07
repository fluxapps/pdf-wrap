/**
 * A generic zoom interaction, which is triggered by a user
 * which interacts with the pdf document.
 */
import { Observable } from "rxjs";
import { ScalePreset } from "../document";
import { StateChangeEvent } from "../event";

export interface ZoomingInteraction {

    /**
     * State change events are emitted when the interaction changes between the enabled and disabled.
     *
     * @see StateChangeEvent
     */
    readonly stateChange: Observable<StateChangeEvent>;

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
 * Base interface for all double tap interactions.
 */
export interface DoubleTapInteraction extends ZoomingInteraction {
    /**
     * The maximum time delta in ms between two taps,
     * which will trigger this interaction.
     *
     * Floating point values are rounded to the next bigger integer.
     *
     * Defaults to 500ms.
     */
    maxDoubleTapDelta: number;
}

/**
 * A touch double tap interaction which zooms in and out of a pdf document.
 * The double tap zoom mode is exclusive and will deactivate other double tap zoom gestures.
 *
 * Behaviour:
 * If the user double taps the document, the interaction will increase the scale of the document.
 * After a second double tap the document scale will be restored.
 *
 * This interaction will not restore the original scale value if the user manipulates the value by other means (pinch etc.).
 *
 * Zooms page by 20%.
 */
export interface DoubleTapZoomingInteraction extends DoubleTapInteraction {

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

/**
 * A touch double tap interaction which snaps the document to a predefined value for example page height.
 * The double tap snap mode is exclusive and will deactivate other double tap zoom gestures.
 *
 * Behaviour:
 * If the user double taps the document, the interaction will zoom the page to a predefined value like page height.
 */
export interface DoubleTapSnapInteraction extends DoubleTapInteraction {

    /**
     * The preset which is used to scale the document if the gesture is
     * detected.
     *
     * Valid values:
     * - "page-width"   -> scales to page width
     * - "page-height"  -> scales to page height
     * - "page-fit"     -> tries to fit the page into the viewport
     * - "page-actual"  -> scales document to its actual size
     * - "auto"         -> automatically scales the document
     *
     * @throws TypeError - Throws when an invalid value is passed to the property.
     */
    scaleTo: ScalePreset;
}

/**
 * Double tap interactions collection.
 */
export interface DoubleTabInteractions {
    /**
     * @see DoubleTapZoomingInteraction
     */
    readonly zoom: DoubleTapZoomingInteraction;
    /**
     * @see DoubleTapSnapInteraction
     */
    readonly snap: DoubleTapSnapInteraction;
}
