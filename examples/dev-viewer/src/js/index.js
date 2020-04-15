import 'core-js/stable/promise';
import './ui';
import './storage';

import {LoggerFactory, LogLevel} from "@srag/pdf-wrap/log-config";

import {PDFjsDocumentService, setAssetsSrc} from "@srag/pdf-wrap/pdfjs/pdfjs.document.service";
import {URI} from "@srag/pdf-wrap/api/document.service";

import {SelectionButton} from "./tools/selection";
import {FormsService} from "./tools/forms";
import {ClearButton, HighlightButton, HighlightService} from "./tools/highlight";
import {EraserButton, PenButton} from "./tools/freehand";
import {SidebarManager} from "./sidebar";


LoggerFactory.configure({
    logGroups: [
        {
            logger: "ch/studerraimann/pdfwrap",
            logLevel: LogLevel.TRACE
        }
    ]
});

setAssetsSrc("assets/libs/pdf-wrap");

let documentService = null;
let pdfDoc = null;

export async function loadPDF() {
    documentService = new PDFjsDocumentService();
    const pdf = await (await fetch("assets/resources/chicken.pdf")).blob();
    const pdfDocument = await documentService.loadWith({
        container: document.getElementById("viewerContainer"),
        pdf: pdf,
        layerStorage: URI.from("mem://chicken.pdf")
    });

    pdfDocument.scaleTo("page-fit");

    new HighlightService(pdfDocument.highlighting);
    new PenButton(pdfDocument.toolbox.freehand);
    new EraserButton(pdfDocument.toolbox.eraser);
    new SelectionButton(pdfDocument.toolbox.selection, pdfDocument.highlighting);


    // search
    const searchButton = document.getElementById("search-button");
    const previousSearch = document.getElementById("previous-button");
    const nextSearch = document.getElementById("next-button");
    let searchActive = false;

    new FormsService(pdfDocument.toolbox.forms);

    const searchField = document.getElementById("search-term");

    searchButton.addEventListener("click", () => {

        searchActive = !searchActive;

        if (searchActive) {
            searchButton.innerText = "Clear";
            pdfDocument.searchController.search(searchField.value, {fuzzy: true, searchPhrase: true, highlightAll: true});
        } else {
            searchButton.innerText = "Search";
            pdfDocument.searchController.reset();
        }
    });

    previousSearch.addEventListener("click", () => {
        pdfDocument.searchController.previous();
    });

    nextSearch.addEventListener("click", () => {
        pdfDocument.searchController.next();
    });

    // zoom
    const zoomIn = document.getElementById("zoom-in-button");
    const zoomOut = document.getElementById("zoom-out-button");

    zoomIn.addEventListener("click", () => {
        pdfDocument.scale = pdfDocument.scale * 1.5;
    });

    zoomOut.addEventListener("click", () => {
        pdfDocument.scale = pdfDocument.scale / 1.5;
    });

    // page navigation
    const pageNumberInput = document.getElementById("page-number");
    pageNumberInput.innerHTML = pdfDocument.currentPageNumber.toString();

    pdfDocument.pageChange.subscribe(it => {
        pageNumberInput.innerHTML = it.pageNumber.toString();
    });

    const pageCountLabel = document.getElementById("page-count-label");
    pageCountLabel.innerHTML = "/ " + pdfDocument.pageCount;

    const previousPage = document.getElementById("previous-page");
    const nextPage = document.getElementById("next-page");

    previousPage.addEventListener("click", () => {
        pdfDocument.currentPageNumber = pdfDocument.currentPageNumber - 1;
    });

    nextPage.addEventListener("click", () => {
        pdfDocument.currentPageNumber = pdfDocument.currentPageNumber + 1;
    });

    // sidebar left
    const sidebarManager = new SidebarManager(pdfDocument);
    sidebarManager.renderOutline();
    sidebarManager.renderThumbnails();

    pdfDocument.highlighting.enable();
    pdfDoc = pdfDocument;

}

export function close() {
    console.log("close");
    const thumbnails = document.getElementById("thumbnails");
    while (thumbnails.lastChild) {
        thumbnails.removeChild(thumbnails.lastChild);
    }
    pdfDoc.close();
    pdfDoc = null;
    documentService = null;
}

loadPDF();

document.getElementById("close-page").addEventListener("click", close);
document.getElementById("load-page").addEventListener("click", loadPDF);


