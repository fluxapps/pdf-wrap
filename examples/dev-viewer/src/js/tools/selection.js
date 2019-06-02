import {selectedColors} from "../color-pickers";
import {tap, filter} from "rxjs/operators";

export class SelectionButton {

    /**
     *
     * @param {Selection} selection
     * @param {Highlighting} highlighting
     */
    constructor(selection, highlighting) {
        this.freehand = selection;
        this.highlighting = highlighting;
        this._button = document.getElementById("selection-tool");
        this._borderSizeInput = document.getElementById("border-size");
        this._menuEntry = document.getElementById("selection-action-dropdown");
        this._removeButton = document.getElementById("selection-remove");
        this._forwardsButton = document.getElementById("selection-forwards");
        this._backwardsButton = document.getElementById("selection-backwards");
        this._toFrontButton = document.getElementById("selection-to-front");
        this._toBackButton = document.getElementById("selection-to-back");
        this._selection = null;
        this._borderSizeInput.addEventListener("change", () => {
            this._selection.borderWidth = parseInt(this._borderSizeInput.value);
        });
        selectedColors.addChangeEvent( () => {
            if (this._selection) {
                this._selection.fillColor = selectedColors.fill;
                this._selection.borderColor = selectedColors.border;
            }
        });

        this._removeButton.addEventListener("click", () => this._selection.delete());
        this._backwardsButton.addEventListener("click", () => this._selection.backwards());
        this._forwardsButton.addEventListener("click", () => this._selection.forwards());
        this._toFrontButton.addEventListener("click", () => this._selection.toFront());
        this._toBackButton.addEventListener("click", () => this._selection.toBack());

        this.freehand.stateChange.subscribe(it => {

            if (it.isActive) {
                this._button.classList.add("active");
            } else {
                this._button.classList.remove("active");
            }
        });

        this.freehand.onElementSelection
            .pipe(
                tap((it) => {
                    if (!it.hasSelection) {
                        this._selection = null;
                        this._menuEntry.style.visibility = "hidden";
                    }
                }),
                filter((it) => it.hasSelection)
            )
            .subscribe(it => {
                this._selection = it.selection;
                this._menuEntry.style.visibility = "visible";
            });

        this._button.addEventListener("click", () => {
            this.freehand.toggle();
        });
    }
}
