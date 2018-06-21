const {colorFromHex} = require("pdf-wrap/api/draw/color");
const {PDFjsDocumentService, setWorkerSrc, setMapUrl} = require("pdf-wrap/pdfjs/pdfjs.document.service");
const {URI} = require("pdf-wrap/api/document.service");
const {StorageRegistry} = require("pdf-wrap/api/storage/adapter.registry");
const {EmptyStorageAdapter} = require("pdf-wrap/api/storage/adapter");
const {LoggerFactory} = require("pdf-wrap/log-config");

LoggerFactory.configure({
    logGroups: [
        {
            logger: "ch/studerraimann/pdfwrap",
            logLevel: 0
        }
    ]
});

StorageRegistry.instance.add(new EmptyStorageAdapter(URI.from("ex://")));

setWorkerSrc("assets/libs/pdf-wrap/pdf.worker.js");
setMapUrl("assets/libs/pdf-wrap/cmaps");

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

export class PenButton {

    constructor(freehand) {
        this.freehand = freehand;
        this._button = document.getElementById("pen-button");

        this.freehand.stateChange.subscribe(it => {

            if (it.isActive) {
                this._button.classList.add("button-primary");
            } else {
                this._button.classList.remove("button-primary");
            }
        });

        this._button.addEventListener("click", () => {
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
                this._button.classList.add("button-primary");
            } else {
                this._button.classList.remove("button-primary");
            }
        });

        this._button.addEventListener("click", () => {
            this.eraser.toggle();
        });
    }
}

export class SearchButton {

    constructor(searchController) {
        this._searchController = searchController;
        this._button = document.getElementById("search-button");
        this._previous = document.getElementById("previous-button");
        this._next = document.getElementById("next-button");

        this.searchField = document.getElementById("search-term");

        this._button.addEventListener("click", () => {
            this._searchController.search(this.searchField.value, {fuzzy: true, searchPhrase: true, highlightAll: true});
        });

        this._previous.addEventListener("click", () => {
            this._searchController.previous();
        });

        this._next.addEventListener("click", () => {
            this._searchController.next();
        })
    }
}

export class SidebarManager {

    constructor(pdf) {
        this._pdf = pdf;
        this._outline = pdf.getOutline();

        this._sidebar = document.getElementById("table-of-contents");
    }

    render() {

        this._outline.then(outline => {

            outline.flatList.forEach(it => {

                const li = document.createElement("li");

                li.innerHTML = it.title;
                li.addEventListener("click", () => {
                    this._pdf.currentPageNumber = it.pageNumber;
                });

                this._sidebar.appendChild(li);
            });
        });
    }
}

const documentService = new PDFjsDocumentService();

documentService.loadWith({
    container: document.getElementById("viewerContainer"),
    pdf: "assets/resources/chicken.pdf",
    layerStorage: URI.from("ex://")
}).then(it => {

    const highlightService = new HighlightService();

    const highlightButton = new HighlightButton(highlightService);
    const clearButton = new ClearButton(highlightService);
    const penButton = new PenButton(it.toolbox.freehand);
    const eraserButton = new EraserButton(it.toolbox.eraser);

    const searchButton = new SearchButton(it.searchController);

    const sidebarManager = new SidebarManager(it);
    sidebarManager.render();

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



