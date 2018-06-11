import {Observable} from "rxjs/internal/Observable";
import {PageChangeEvent} from "../event/event.api";
import {Outline, PageThumbnail} from "./document.info";
import {Toolbox} from "../tool/toolbox";
import {Highlighting} from "../highlight/highlight.api";

/**
 * Describes a PDF document containing several meta information and document data.
 * In addition, it allows to modify the view where the PDF is displayed.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PDFDocument {

    /**
     * The scale of the PDF view.
     * May be changed to zoom in or out.
     */
    scale: number;

    /**
     * The page number of the current displayed page.
     * May be changed to jump to another page.
     */
    currentPageNumber: number;

    readonly pageCount: number;

    /**
     * A hot {@code Observable} which emits every time the displayed page is changed.
     */
    readonly pageChange: Observable<PageChangeEvent>;

    /**
     * A toolbox containing several tools to modify a PDF page.
     */
    readonly toolbox: Toolbox;

    /**
     * Highlighting object to enable / disable or modify the text highlighting of a PDF page.
     */
    readonly highlighting: Highlighting;

    /**
     * @returns {Promise<Outline>} the outline of a PDF
     */
    getOutline(): Promise<Outline>;

    /**
     * Returns a observable which emits a {@link PageThumbnail} for each given page number.
     * The observable completes when the last thumbnail is emitted.
     *
     * @param {number} pageNumbers - the page numbers for the thumbnails that should be returned
     *
     * @returns {Observable<PageThumbnail>} a observable which emits the thumbnails
     */
    getThumbnails(...pageNumbers: Array<number>): Observable<PageThumbnail>;
}
