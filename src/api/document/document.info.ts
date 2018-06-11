
/**
 * Contains the outline information of a PDF.
 * Outline is available as a tree hierarchy
 * or as a flat list.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class Outline {

    get flatList(): Array<OutlineEntry> {
        const nestedOutline: Array<Array<OutlineEntry>> = this.tree.map((it) => this.map(it));
        return ([] as Array<OutlineEntry>).concat(...nestedOutline);
    }

    constructor(
        readonly tree: Array<TreeOutlineEntry>
    ) {}

    private map(it: TreeOutlineEntry): Array<OutlineEntry> {
        const parent: OutlineEntry = new OutlineEntry(it.title, it.pageNumber);
        const nestedChildren: Array<Array<OutlineEntry>> = it.children.map((child) => this.map(child));
        const children: Array<OutlineEntry> = ([] as Array<OutlineEntry>).concat(...nestedChildren);

        return [parent, ...children];
    }
}

/**
 * Contains outline of a PDF in a flat structure.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class OutlineEntry {

    constructor(
        readonly title: string,
        readonly pageNumber: number
    ) {}
}

/**
 * Contains outline of a PDF in a tree hierarchy.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class TreeOutlineEntry extends OutlineEntry {

    constructor(
        title: string,
        pageNumber: number,
        readonly children: Array<TreeOutlineEntry> = []
    ) {
        super(title, pageNumber);
    }
}

/**
 * A thumbnail of a single page of a PDF.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PageThumbnail {

    constructor(
        readonly content: Blob,
        readonly pageNumber: number
    ) {}
}
