const {colorFromHex} = require("pdf-wrap/api/draw/color");
const {PDFjsDocumentService, setWorkerSrc, setCMapUrl} = require("pdf-wrap/pdfjs/pdfjs.document.service");
const {URI} = require("pdf-wrap/api/document.service");
const {StorageRegistry} = require("pdf-wrap/api/storage/adapter.registry");
const {PageOverlay} = require("pdf-wrap/api/storage/adapter");
const {LoggerFactory} = require("pdf-wrap/log-config");

LoggerFactory.configure({
    logGroups: [
        {
            logger: "ch/studerraimann/pdfwrap",
            logLevel: 0
        }
    ]
});

export class InMemStorageAdapter {

    constructor() {
        this._memory = new Map();
    }

    register() {
        return URI.from("mem://");
    }

    start(uri, events) {


        const store = this._getStore(uri.uri);

        events.afterPolyLineRendered().subscribe(it => {
            store.set(it.element.id, it);
        });

        events.afterRectangleRendered().subscribe(it => {
            store.set(it.element.id, it);
        });

        events.afterElementRemoved().subscribe(it => {
            store.delete(it.element.id);
        })
    }

    loadPage(uri, pageNumber) {

        const store = this._getStore(uri.uri);

        const highlights = [];
        const drawings = [];

        for (let item of store.values()) {

            if (item.pageNumber === pageNumber && item.layer === 0) {
                highlights.push(item.element);
            }

            if (item.pageNumber === pageNumber && item.layer === 1) {
                drawings.push(item.element);
            }
        }

        return new PageOverlay(
            pageNumber,
            highlights,
            drawings
        );
    }

    _getStore(uri) {
        if (!this._memory.has(uri)) {
            this._memory.set(uri, new Map());
        }

        return this._memory.get(uri);
    }
}

StorageRegistry.instance.add(new InMemStorageAdapter());

setWorkerSrc("assets/libs/pdf-wrap/pdf.worker.js");
setCMapUrl("assets/libs/pdf-wrap/cmaps");

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

export class SidebarManager {

    constructor(pdf) {
        this._pdf = pdf;
        this._outline = pdf.getOutline();

        const pages = []; while (pages.length < pdf.pageCount) pages.push(pages.length + 1);

        this._thumbails = pdf.getThumbnails(96, ...pages);

        this._tableOfContents = document.getElementById("table-of-contents");
        this._thumbnailsUlElement = document.getElementById("thumbnails");
    }

    renderOutline() {

        this._outline.then(outline => {

            outline.flatList.forEach(it => {

                const li = document.createElement("li");

                li.innerHTML = it.title;
                li.addEventListener("click", () => {
                    this._pdf.currentPageNumber = it.pageNumber;
                });

                this._tableOfContents.appendChild(li);
            });
        });
    }

    renderThumbnails() {

        this._thumbails.subscribe(it => {

            const li = document.createElement("li");
            li.classList.add("center");
            li.classList.add("aligned");

            li.appendChild(it.content);
            li.addEventListener("click", () => {
                this._pdf.currentPageNumber = it.pageNumber;
            });

            this._thumbnailsUlElement.appendChild(li);
        });
    }
}

const documentService = new PDFjsDocumentService();


new Promise(resolve => {

    const request = new XMLHttpRequest();
    request.open('GET', "assets/resources/chicken.pdf", true);
    request.responseType = 'blob';
    request.onload = function() {
        resolve(request.response);
    };
    request.send();
}).then(pdf => {
    return documentService.loadWith({
        container: document.getElementById("viewerContainer"),
        pdf: pdf,
        layerStorage: URI.from("mem://chicken.pdf")
    })
}).then(it => {

    const highlightService = new HighlightService();

    const highlightButton = new HighlightButton(highlightService);
    const clearButton = new ClearButton(highlightService);
    const penButton = new PenButton(it.toolbox.freehand);
    const eraserButton = new EraserButton(it.toolbox.eraser);

    // search
    const searchButton = document.getElementById("search-button");
    const previousSearch = document.getElementById("previous-button");
    const nextSearch = document.getElementById("next-button");

    const searchField = document.getElementById("search-term");

    searchButton.addEventListener("click", () => {
        it.searchController.search(searchField.value, {fuzzy: true, searchPhrase: true, highlightAll: true});
    });

    previousSearch.addEventListener("click", () => {
        it.searchController.previous();
    });

    nextSearch.addEventListener("click", () => {
        it.searchController.next();
    });

    // zoom
    const zoomIn = document.getElementById("zoom-in-button");
    const zoomOut = document.getElementById("zoom-out-button");

    zoomIn.addEventListener("click", () => {
        it.scale = it.scale * 1.5;
    });

    zoomOut.addEventListener("click", () => {
        it.scale = it.scale / 1.5;
    });

    // page navigation
    const pageNumberInput = document.getElementById("page-number");
    pageNumberInput.innerHTML = it.currentPageNumber;

    it.pageChange.subscribe(it => {
        pageNumberInput.innerHTML = it.pageNumber;
    });

    const pageCountLabel = document.getElementById("page-count-label");
    pageCountLabel.innerHTML = "/ " + it.pageCount;

    const previousPage = document.getElementById("previous-page");
    const nextPage = document.getElementById("next-page");

    previousPage.addEventListener("click", () => {
        it.currentPageNumber = it.currentPageNumber - 1;
    });

    nextPage.addEventListener("click", () => {
        it.currentPageNumber = it.currentPageNumber + 1;
    });

    // sidebar left
    const sidebarManager = new SidebarManager(it);
    sidebarManager.renderOutline();
    sidebarManager.renderThumbnails();

    it.highlighting.enable();

    // highlighting
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



