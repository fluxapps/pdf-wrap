// import {PDFjsDocmuentService} from "pdf-wrap/pdfjs/pdfjs.document.service";
// import {URI} from "pdf-wrap/api/document.service";

const {PDFjsDocumentService, setWorkerSrc, setMapUrl} = require("pdf-wrap/pdfjs/pdfjs.document.service");
const {URI} = require("pdf-wrap/api/document.service");

setWorkerSrc("assets/libs/pdfjs-dist/build/pdf.worker.js");
setMapUrl("assets/libs/pdfjs-dist/cmaps");

const documentService = new PDFjsDocumentService();

documentService.loadWith({
    container: document.getElementById("viewerContainer"),
    pdf: "assets/resources/chicken.pdf",
    layerStorage: URI.from("ex://")
});