export class MockClientRectList extends Array<DOMRect> implements DOMRectList {

    [index: number]: DOMRect;

    constructor(
        clientRects: Array<DOMRect>
    ) {
        super(...clientRects);
    }

    item(index: number): DOMRect {
        return this[index];
    }
}

export class MockRange implements Range {

    readonly END_TO_END: number = 0;
    readonly END_TO_START: number = 0;
    readonly START_TO_END: number = 0;
    readonly START_TO_START: number = 0;
    readonly collapsed: boolean = false;
    readonly endOffset: number = 0;
    readonly startOffset: number = 0;

    get commonAncestorContainer(): Node {
        throw new Error("Not implemented test stub");
    }

    get endContainer(): Node {
        throw new Error("Not implemented test stub");
    }

    get startContainer(): Node {
        throw new Error("Not implemented test stub");
    }

    cloneContents(): DocumentFragment {
        throw new Error("Not implemented test stub");
    }

    cloneRange(): Range {
        throw new Error("Not implemented test stub");
    }

    collapse(_?: boolean): void {
        throw new Error("Not implemented test stub");
    }

    compareBoundaryPoints(_: number, __: Range): number {
        throw new Error("Not implemented test stub");
    }

    createContextualFragment(_: string): DocumentFragment {
        throw new Error("Not implemented test stub");
    }

    deleteContents(): void {
        throw new Error("Not implemented test stub");
    }

    detach(): void {
        throw new Error("Not implemented test stub");
    }

    extractContents(): DocumentFragment {
        throw new Error("Not implemented test stub");
    }

    getBoundingClientRect(): DOMRect {
        throw new Error("Not implemented test stub");
    }

    getClientRects(): DOMRectList {
        throw new Error("Not implemented test stub");
    }

    insertNode(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    isPointInRange(_: Node, __: number): boolean {
        throw new Error("Not implemented test stub");
    }

    selectNode(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    selectNodeContents(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    setEnd(_: Node, __: number): void {
        throw new Error("Not implemented test stub");
    }

    setEndAfter(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    setEndBefore(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    setStart(_: Node, __: number): void {
        throw new Error("Not implemented test stub");
    }

    setStartAfter(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    setStartBefore(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    surroundContents(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    comparePoint(_: Node, __: number): number {
        throw new Error("Not implemented test stub");
    }

    intersectsNode(_: Node): boolean {
        throw new Error("Not implemented test stub");
    }
}

export class MockSelection implements Selection {
    get anchorNode(): Node {
        throw new Error("Not implemented test stub");
    }
    readonly anchorOffset: number = 0;
    get baseNode(): Node {
        throw new Error("Not implemented test stub");
    }
    readonly baseOffset: number = 0;
    get extentNode(): Node {
        throw new Error("Not implemented test stub");
    }
    readonly extentOffset: number = 0;
    get focusNode(): Node {
        throw new Error("Not implemented test stub");
    }
    readonly focusOffset: number = 0;
    readonly isCollapsed: boolean = false;
    readonly rangeCount: number = 0;
    readonly type: string = "";

    addRange(_: Range): void {
        throw new Error("Not implemented test stub");
    }

    collapse(_: Node, __: number): void {
        throw new Error("Not implemented test stub");
    }

    collapseToEnd(): void {
        throw new Error("Not implemented test stub");
    }

    collapseToStart(): void {
        throw new Error("Not implemented test stub");
    }

    containsNode(_: Node, __: boolean): boolean {
        throw new Error("Not implemented test stub");
    }

    deleteFromDocument(): void {
        throw new Error("Not implemented test stub");
    }

    empty(): void {
        throw new Error("Not implemented test stub");
    }

    extend(_: Node, __: number): void {
        throw new Error("Not implemented test stub");
    }

    getRangeAt(_: number): Range {
        throw new Error("Not implemented test stub");
    }

    removeAllRanges(): void {
        throw new Error("Not implemented test stub");
    }

    removeRange(_: Range): void {
        throw new Error("Not implemented test stub");
    }

    selectAllChildren(_: Node): void {
        throw new Error("Not implemented test stub");
    }

    setBaseAndExtent(_: Node, __: number, ___: Node, ____: number): void {
        throw new Error("Not implemented test stub");
    }

    setPosition(_: Node, __: number): void {
        throw new Error("Not implemented test stub");
    }
}
