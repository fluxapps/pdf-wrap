import { PDFFindController } from "pdfjs-dist/web/pdf_viewer";
import { Logger } from "typescript-logging";
import { DocumentSearch, SearchOptions } from "../api/search";
import { LoggerFactory } from "../log-config";

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

    private readonly log: Logger = LoggerFactory.getLogger("ch/studerraimann/pdfwrap/pdfjs/document.search:PDFjsDocumentSearch");

    constructor(
        private readonly findController: PDFFindController
    ) {}

    search(query: string, options: SearchOptions): void {

        this.lastQuery = query;
        this.options = options;

        if (this.isQueryEmpty()) {
            return;
        }

        this.log.info(() => `Search document for query: query=${query}`);

        this.findController.executeCommand("find", {
            caseSensitive: !this.options.fuzzy,
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

        this.log.trace(() => `Search next result: query=${this.lastQuery}`);

        this.findController.executeCommand("findagain", {
            caseSensitive: !this.options.fuzzy,
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

        this.log.trace(() => `Search previous result: query=${this.lastQuery}`);

        this.findController.executeCommand("findagain", {
            caseSensitive: !this.options.fuzzy,
            findPrevious: true,
            highlightAll: this.options.highlightAll,
            phraseSearch: this.options.searchPhrase,
            query: this.lastQuery
        });
    }

    reset(): void {

        this.log.trace(() => "Reset search state");

        this.findController.executeCommand("", {
            caseSensitive: false,
            findPrevious: false,
            highlightAll: false,
            phraseSearch: false,
            query: ""
        });
    }

    private isQueryEmpty(): boolean {
        return this.lastQuery.length === 0;
    }
}
