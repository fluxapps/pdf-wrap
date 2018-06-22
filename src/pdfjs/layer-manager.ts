import {PageRenderedEvent} from "pdfjs-dist/web/pdf_viewer";
import {Canvas, SVGCanvas} from "../paint/painters";
import svgjs from "svgjs";

/**
 * Creates and appends the different page layers to the DOM.
 * Attributes like {@code id} or {@code class} are set according
 * to the layer being rendered.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 * @internal
 */
export class LayerManager {

    readonly pageContainer: HTMLDivElement;
    readonly pdfLayer: HTMLDivElement;
    readonly textLayer: HTMLDivElement;

    readonly width: number;
    readonly height: number;

    readonly pageNumber: number;

    get pageIndex(): number {
        return this.pageNumber - 1;
    }

    constructor(
        pageRenderedEvent: PageRenderedEvent
    ) {
        this.pageNumber = pageRenderedEvent.pageNumber;
        this.pageContainer = pageRenderedEvent.source.div;

        this.width = pageRenderedEvent.source.viewport.width;

        this.height = pageRenderedEvent.source.viewport.height;

        this.pdfLayer = this.pageContainer.getElementsByClassName("canvasWrapper").item(0) as HTMLDivElement;
        this.textLayer = this.pageContainer.getElementsByClassName("textLayer").item(0) as HTMLDivElement;
    }

    /**
     * Creates a highlight layer and adds it to the DOM.
     *
     * @returns {Canvas} the created layer
     */
    createHighlightLayer(): Canvas {

        const highlightDiv: HTMLDivElement = createLayerDiv(this.height, this.width);
        highlightDiv.setAttribute("id", `highlight-layer-page-${this.pageNumber}`);

        this.pageContainer.insertBefore(highlightDiv, this.pdfLayer);

        const highlightSVG: svgjs.Doc = svgjs(`${highlightDiv.id}`);
        return new SVGCanvas(highlightSVG);
    }

    /**
     * Creates a highlight transparency layer and adds it to the DOM.
     *
     * @returns {Canvas} the created layer
     */
    createHighlightTransparencyLayer(): Canvas {

        const highlightTransparencyDiv: HTMLDivElement = createLayerDiv(this.height, this.width);
        highlightTransparencyDiv.setAttribute("id", `highlight-transparency-layer-page-${this.pageNumber}`);
        highlightTransparencyDiv.classList.add("transparent");

        this.pageContainer.insertBefore(highlightTransparencyDiv, this.textLayer);

        const highlightTransparencySVG: svgjs.Doc = svgjs(`${highlightTransparencyDiv.id}`);
        return new SVGCanvas(highlightTransparencySVG);
    }

    /**
     * Creates a drawing layer and adds it to the DOM.
     *
     * @returns {Canvas} the created layer
     */
    createDrawingLayer(): Canvas {

        const drawDiv: HTMLDivElement = createLayerDiv(this.height, this.width);
        drawDiv.setAttribute("id", `draw-layer-page-${this.pageNumber}`);
        drawDiv.classList.add("draw-layer");

        this.pageContainer.insertBefore(drawDiv, this.textLayer);

        const drawSVG: svgjs.Doc = svgjs(`${drawDiv.id}`);
        return new SVGCanvas(drawSVG);
    }

    /**
     * Removes all DOM elements containing {@code page-layer} an their class list.
     */
    removeLayers(): void {
        Array.from(this.pageContainer.children)
            .forEach((child) => {
                if (child.classList.contains("page-layer")) {
                    this.pageContainer.removeChild(child);
                }
            });
    }
}

function createLayerDiv(height: number, width: number): HTMLDivElement {

    const div: HTMLElementTagNameMap["div"] = window.document.createElement("div");
    div.setAttribute("style", `width: ${width}px; height: ${height}px`);
    div.classList.add("page-layer");

    return div;
}
