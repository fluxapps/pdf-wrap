// import {PDFjsDocmuentService} from "pdf-wrap/pdfjs/pdfjs.document.service";
// import {URI} from "pdf-wrap/api/document.service";

const {colorFromHex} = require("pdf-wrap/api/draw/color");
const {PDFjsDocumentService, setWorkerSrc, setMapUrl} = require("pdf-wrap/pdfjs/pdfjs.document.service");
const {URI} = require("pdf-wrap/api/document.service");

setWorkerSrc("assets/libs/pdf-wrap/pdf.worker.js");
setMapUrl("assets/libs/pdf-wrap");

class HighlightService {

    get textSelection() {

        if(this._textSelection === undefined) {
            throw Error("No text selection available");
        }

        return this._textSelection;
    }

    set textSelection(textSelection) {
        this._textSelection = textSelection;
    }

    constructor() {
        this._textSelection = undefined;
    }

    highlight(color) {
        this.textSelection.highlight(colorFromHex(color));
        this._textSelection = undefined;
    }

    clear() {
        this.textSelection.clearHighlight();
        this._textSelection = undefined;
    }
}

export class HighlightButton {

    constructor(highlightService) {
        this._button = document.getElementById("highlight-button");
        this._button.disabled = true;
        this.highlightService = highlightService;

        this._onClick = () => {
            const color = document.getElementById("highlight-color");
            this.highlightService.highlight(color.value);
        }
    }

    enable() {
        this._button.disabled = false;
        this._button.addEventListener("click", this._onClick);
    }

    disable() {
        this._button.disabled = true;
        this._button.removeEventListener("click", this._onClick);
    }
}

export class ClearButton {

    constructor(highlightService) {
        this._button = document.getElementById("clear-button");
        this._button.disabled = true;
        this.highlightService = highlightService;

        this._onClick = () => {
            this.highlightService.clear();
        }
    }

    enable() {
        this._button.disabled = false;
        this._button.addEventListener("click", this._onClick);
    }

    disable() {
        this._button.disabled = true;
        this._button.removeEventListener("click", this._onClick);
    }
}

const highlightService = new HighlightService();

const highlightButton = new HighlightButton(highlightService);
const clearButton = new ClearButton(highlightService);

const documentService = new PDFjsDocumentService();

const pdf = documentService.loadWith({
    container: document.getElementById("viewerContainer"),
    pdf: "assets/resources/chicken.pdf",
    layerStorage: URI.from("ex://")
}).then(it => {

    it.highlighting.enable();

    it.highlighting.onTextSelection
        .subscribe(it => {
            highlightService.textSelection = it;
            highlightButton.enable();
            clearButton.enable();
        });

    it.highlighting.onTextUnselection
        .subscribe(() => {
            highlightButton.disable();
            clearButton.disable();
        });
});



