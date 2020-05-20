import {selectedColors} from "../color-pickers";

export class HighlightService {

    get textSelection() {

        if(this._textSelection === null) {
            throw Error("No text selection available");
        }

        return this._textSelection;
    }

    set textSelection(textSelection) {
        this._textSelection = textSelection;
    }

    constructor(highlight) {
        this._textSelection = null;

        const highlightModeButton = new HighlightModeButton(highlight);
        const highlightButton = new HighlightButton(this);
        const clearButton = new ClearButton(this);

        highlight.stateChange.subscribe((it) => {
            if (!it.isActive) {
                highlightButton.disable();
                clearButton.disable();
                this._textSelection = null;
                highlightModeButton.disable();
            } else {
                highlightModeButton.enable();
            }
        });

        // highlighting
        highlight.onTextSelection
            .subscribe(it => {
                this.textSelection = it;
                highlightButton.enable();
                clearButton.enable();
            });

        highlight.onTextUnselection
            .subscribe(() => {
                this.textSelection = null;
                highlightButton.disable();
                clearButton.disable();
            });
    }

    highlight(color) {
        this.textSelection.highlight(color);
        this._textSelection = null;
    }

    clear() {
        this.textSelection.clearHighlight();
        this._textSelection = null;
    }
}

class HighlightButton {

    constructor(highlightService) {
        this._button = document.getElementById("highlight-button");
        this._button.classList.add("disabled");
        this.highlightService = highlightService;

        this._onClick = () => {
            this.highlightService.highlight(selectedColors.highlight);
        }
    }

    enable() {
        this._button.classList.remove("disabled");
        this._button.addEventListener("click", this._onClick);
    }

    disable() {
        this._button.classList.add("disabled");
        this._button.removeEventListener("click", this._onClick);
    }
}

class HighlightModeButton {

    constructor(highlight) {
        this._button = document.getElementById("highlight-button-mode");

        this._button.addEventListener("click", () => {
            highlight.toggle();
        })
    }

    enable() {
        this._button.classList.add("active");

    }

    disable() {
        this._button.classList.remove("active");
    }
}

class ClearButton {

    constructor(highlightService) {
        this._button = document.getElementById("clear-button");
        this._button.classList.add("disabled");
        this.highlightService = highlightService;

        this._onClick = () => {
            this.highlightService.clear();
        }
    }

    enable() {
        this._button.classList.remove("disabled");
        this._button.addEventListener("click", this._onClick);
    }

    disable() {
        this._button.classList.add("disabled");
        this._button.removeEventListener("click", this._onClick);
    }
}
