// Patch TouchEvent because the scale property is not standardized

interface TouchEvent {
    /**
     * Distance between two digits since the event's beginning.
     * Expressed as a floating-point multiple of the initial distance between the digits at the beginning of the event.
     * Values below 1.0 indicate an inward pinch (zoom out).
     * Values above 1.0 indicate an outward unpinch (zoom in).
     * Initial value: 1.0
     */
    scale: number;
}
