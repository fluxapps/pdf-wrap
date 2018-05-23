/**
 * {@code DocumentSearch} performs a search over a pdf document.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface DocumentSearch {

    search(query: string, options: SearchOptions): void;
    next(): void;
    previous(): void;
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