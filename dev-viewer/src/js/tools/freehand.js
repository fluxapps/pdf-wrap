import {selectedColors} from "../color-pickers";

export class PenButton {

    /**
     *
     * @param {Freehand} freehand
     */
    constructor(freehand) {
        this.freehand = freehand;
        this._button = document.getElementById("pen-button");
        this._borderSizeInput = document.getElementById("border-size");
        this._borderSizeInput.addEventListener("change", () => {
            this.freehand.setStrokeWidth(parseInt(this._borderSizeInput.value));
        });
        selectedColors.addChangeEvent( () => {
            this.freehand.setColor(selectedColors.border);
        });

        this.freehand.stateChange.subscribe(it => {

            if (it.isActive) {
                this._button.classList.add("active");
            } else {
                this._button.classList.remove("active");
            }
        });

        this._button.addEventListener("click", () => {
            this.freehand.setColor(selectedColors.border);
            this.freehand.setStrokeWidth(parseInt(this._borderSizeInput.value));
            this.freehand.toggle();
        });
    }
}

export class EraserButton {

    constructor(eraser) {
        this.eraser = eraser;
        this._button = document.getElementById("eraser-button");

        this.eraser.stateChange.subscribe(it => {

            if (it.isActive) {
                this._button.classList.add("active");
            } else {
                this._button.classList.remove("active");
            }
        });

        this._button.addEventListener("click", () => {
            this.eraser.toggle();
        });
    }
}
