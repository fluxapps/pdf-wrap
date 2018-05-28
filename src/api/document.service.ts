/**
 *
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface PDFDocumentService {

    loadWith(optinos: LoadingOptions): Promise<any>
}

/**
 *
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface LoadingOptions {
    readonly container: HTMLElement;
    readonly pdf: Blob;
    readonly layerStorage: URI;
}

/**
 *
 *
 * @author Nicols Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class URI {

    static from(uri: string): URI {
        return new URI(uri);
    }

    readonly schema: string;

    private constructor(
        readonly uri: string,
    ) {
        if (URI_REGX.test(uri)) {
            this.schema = uri.match(URI_REGX)![1];
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
