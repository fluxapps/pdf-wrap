import {DocumentSearch, SearchOptions} from "../api/search/search.api";
import {PDFFindController} from "pdfjs-dist/web/pdf_viewer";

/**
 * {@link DocumentSearch} implementation for PDFjs.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsDocumentSearch implements DocumentSearch {

    private lastQuery: string = "";
    private options: SearchOptions = {
        fuzzy: true,
        highlightAll: true,
        searchPhrase: true
    };

    constructor(
        private readonly findController: PDFFindController
    ) {}

    search(query: string, options: SearchOptions): void {

        this.lastQuery = query;
        this.options = options;

        if (this.isQueryEmpty()) {
            return;
        }

        this.findController.executeCommand("find", {
            caseSensitive: this.options.fuzzy,
            findPrevious: false,
            highlightAll: this.options.highlightAll,
            phraseSearch: this.options.searchPhrase,
            query: this.lastQuery
        });
    }

    next(): void {

        if (this.isQueryEmpty()) {
            return;
        }

        if (this.findController.selected.matchIdx === (this.findController.matchCount - 1)) {
            return;
        }

        this.findController.executeCommand("findagain", {
            caseSensitive: this.options.fuzzy,
            findPrevious: false,
            highlightAll: this.options.highlightAll,
            phraseSearch: this.options.searchPhrase,
            query: this.lastQuery
        });
    }

    previous(): void {

        if (this.isQueryEmpty()) {
            return;
        }

        if (this.findController.selected.matchIdx === 0 && this.findController.selected.pageIdx === 0) {
            return;
        }

        this.findController.executeCommand("findagain", {
            caseSensitive: this.options.fuzzy,
            findPrevious: true,
            highlightAll: this.options.highlightAll,
            phraseSearch: this.options.searchPhrase,
            query: this.lastQuery
        });
    }

    private isQueryEmpty(): boolean {
        return this.lastQuery.length === 0;
    }
}
