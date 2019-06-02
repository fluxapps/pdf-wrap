import {colorFromRgba, colorFromHex} from "@srag/pdf-wrap/api/draw/color";
import $ from "jquery";

class SelectedColors {

    constructor() {
        this._changeEvents = [];
        this.border = colorFromHex("#00FF00");
        this.fill = colorFromHex("#FFFF00");
        this.highlight = colorFromHex("#00FFFF");
        this._init();
    }

    addChangeEvent(fn) {
        this._changeEvents.push(fn);
    }

    _colorFromEvent(event) {
        const [r = 0, g = 0, b = 0, a = 1] = event.color.api().rgb().round().array();
        return colorFromRgba(r, g, b, a);
    }

    _init() {
        $(document).ready(() => {
            const highlightColor = $('#highlight-color');
            const borderColor = $('#border-color');
            const fillColor = $('#fill-color');

            // Basic instantiation:
            highlightColor.colorpicker({
                useAlpha: true,
                format: "rgba",
                popover: {
                    title: 'Highlight Color',
                    placement: 'top'
                }
            });
            borderColor.colorpicker({
                useAlpha: true,
                format: "rgba",
                popover: {
                    title: 'Border Color',
                    placement: 'top'
                }
            });
            fillColor.colorpicker({
                useAlpha: true,
                format: "rgba",
                popover: {
                    title: 'Form Fill Color',
                    placement: 'top'
                }

            });

            highlightColor.on('colorpickerChange', (event) => {
                selectedColors.highlight = this._colorFromEvent(event);
                highlightColor.css("background-color", event.color.toString());
                this._changeEvents.forEach((handler) => handler());
            });

            borderColor.on('colorpickerChange', (event) => {
                selectedColors.border = this._colorFromEvent(event);
                borderColor.css("background-color", event.color.toString());
                this._changeEvents.forEach((handler) => handler());
            });

            fillColor.on('colorpickerChange', (event) => {
                selectedColors.fill = this._colorFromEvent(event);
                fillColor.css("background-color", event.color.toString());
                this._changeEvents.forEach((handler) => handler());
            });

        });
    }
}

export const selectedColors = new SelectedColors();

