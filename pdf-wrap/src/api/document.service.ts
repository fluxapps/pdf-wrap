import {PDFDocument} from "./document";

/**
 * Describes the service to load a PDF document.
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PDFDocumentService {

    /**
     * Loads a PDF by the given loading options, displays it
     * and returns a {@link PDFDocument} to operate with the document.
     *
     * @param {LoadingOptions} options - the options to determine how to load the document
     *
     * @returns {Promise<PDFDocument>} the resulting document
     */
    loadWith(options: LoadingOptions): Promise<PDFDocument>;
}

/**
 * Describes the options to load a PDF document.
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface LoadingOptions {

    /**
     * The html container where the document will be displayed.
     */
    readonly container: HTMLElement;

    /**
     * The PDF document which should be loaded
     */
    readonly pdf: Blob;

    /**
     * The uri to the PDF annotations location.
     * This value will be passed in to all registered {@code StorageAdapter}.
     */
    readonly layerStorage: URI;

    /**
     * The features of the reader which can be configured:
     * - Selectable Text
     * - Rendering mode of the canvas: 2d or webgl
     *
     * The selectable text feature defaults to true, which is the old default behaviour.
     * The rendering mode defaults to webgl because older versions always used webgl to render the pdf pages.
     */
    readonly features?: Partial<ViewFeatures>;
}

/**
 * Contains all the configurable features of the pdf view.
 */
export interface ViewFeatures {
    /**
     * Places invisible text over the pdf canvas
     * in order to enable users to select text in the
     * document.
     *
     * Defaults to true.
     *
     * The selection api does not work if this feature is disabled.
     */
    readonly selectableText: boolean;

    /**
     * Rendering mode of the canvas, which is used to draw the pdf.
     *
     * Defaults to webgl, this option should only be changed if the pdf has some visual errors.
     */
    readonly renderingMode: PageRenderingMode;
}

/**
 * Canvas rendering modes.
 * Which are currently supported by pdfjs.
 */
export enum PageRenderingMode {
    '2D',
    WEBGL
}

/**
 * Represents a Uniform Resource Identifier (URI) reference.
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class URI {

    /**
     * Creates a new {@link URI} from string.
     *
     * URI syntax
     *
     * schema:[authority][path]?[query]#[fragment]
     *
     * where square brackets [...] delineate optional parts.
     *
     * @param {string} uri - the uri as string
     *
     * @returns {URI} the resulting uri
     * @throws {IllegalURIError} if the given value is invalid
     */
    static from(uri: string): URI {
        return new URI(uri);
    }

    readonly schema: string;

    private constructor(
        readonly uri: string,
    ) {
        if (URI_REGX.test(uri)) {
            this.schema = URI_REGX.exec(uri)![1];
        } else {
            throw new IllegalURIError(`Could not create uri from illegal value: uri=${uri}`);
        }
    }
}

/**
 * Indicates an invalid uri value.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class IllegalURIError extends Error {}

const URI_REGX: RegExp = /^(\w+):(?:\/?\/?)[^\s]+$/;
