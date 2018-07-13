/**
 * {@code DocumentSearch} performs a search over a pdf document.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface DocumentSearch {

    /**
     * Searches the given {@code query} by considering the given {@code options}.
     *
     * Depending on the {@code options} the results are highlighted in the DOM.
     *
     * @param {string} query - the query to search for
     * @param {SearchOptions} options - the search options to apply
     */
    search(query: string, options: SearchOptions): void;

    /**
     * Searches the next search result found by the {@link DocumentSearch#search} method.
     *
     * Depending on the {@code options} passed in to the {@code DocumentSearch#search} method
     * the results are highlighted in the DOM.
     */
    next(): void;

    /**
     * Searches the previous search result found by the {@link DocumentSearch#search} method.
     *
     * Depending on the {@code options} passed in to the {@code DocumentSearch#search} method
     * the results are highlighted in the DOM.
     */
    previous(): void;

    /**
     * Resets the search state.
     */
    reset(): void;
}

/**
 * Describes possible options for a document search.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface SearchOptions {
    /**
     * Determines if the search input should be used as a phrase or not.
     */
    readonly searchPhrase: boolean;

    /**
     * Determines if the search input should be case insensitive or not.
     */
    readonly fuzzy: boolean;

    /**
     * Determine if all search results should be highlighted or only the current viewed result.
     */
    readonly highlightAll: boolean;
}
