import {PageOverlay} from "@srag/pdf-wrap/api/storage/adapter";
import {StorageRegistry} from "@srag/pdf-wrap/api/storage/adapter.registry";
import {URI} from "@srag/pdf-wrap/api/document.service";

export class InMemStorageAdapter {

    constructor() {
        this._memory = new Map();
    }

    register() {
        return URI.from("mem://");
    }

    start(uri, events) {


        const store = this._getStore(uri.uri);

        events.afterPolyLineRendered().subscribe(it => {
            store.get("DRAWING").set(it.element.id, it);
        }, (it) => console.error(it), () => console.log("afterPolyLineRendered complete"));

        events.afterHighlightRendered().subscribe(it => {
            store.get("HIGHLIGHT").set(it.element.id, it);
        }, (it) => console.error(it), () => console.log("afterHighlightRendered complete"));

        events.afterElementRemoved().subscribe(it => {
            const subStore =
                store.get("HIGHLIGHT").get(it.element.id) ||
                store.get("RECTANGLE").get(it.element.id) ||
                store.get("ELLIPSE").get(it.element.id) ||
                store.get("CIRCLE").get(it.element.id) ||
                store.get("LINE").get(it.element.id) ||
                store.get("DRAWING").get(it.element.id);
            subStore.delete(it.element.id);
        }, (it) => console.error(it), () => console.log("afterElementRemoved complete"));

        events.afterRectangleRendered().subscribe(it => {
            store.get("RECTANGLE").set(it.element.id, it);
        }, (it) => console.error(it), () => console.log("afterRectangleRendered complete"));

        events.afterEllipseRendered().subscribe(it => {
            store.get("ELLIPSE").set(it.element.id, it);
            console.log(store);
        }, (it) => console.error(it), () => console.log("afterEllipseRendered complete"));

        events.afterCircleRendered().subscribe(it => {
            store.get("CIRCLE").set(it.element.id, it);
            console.log(store);
        }, (it) => console.error(it), () => console.log("afterCircleRendered complete"));

        events.afterLineRendered().subscribe(it => {
            store.get("LINE").set(it.element.id, it);
            console.log(store);
        }, (it) => console.error(it), () => console.log("afterLineRendered complete"));
    }

    loadPage(uri, pageNumber) {

        const store = this._getStore(uri.uri);

        const highlights = [];
        const drawings = [];
        const rectangles = [];
        const ellipses = [];
        const circles = [];
        const lines = [];

        Array.from(store.get("HIGHLIGHT").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => highlights.push(it.element));
        Array.from(store.get("DRAWING").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => drawings.push(it.element));
        Array.from(store.get("RECTANGLE").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => rectangles.push(it.element));
        Array.from(store.get("ELLIPSE").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => ellipses.push(it.element));
        Array.from(store.get("CIRCLE").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => circles.push(it.element));
        Array.from(store.get("LINE").values())
            .filter((it) => it.pageNumber === pageNumber)
            .forEach((it) => lines.push(it.element));

        return new PageOverlay(
            pageNumber,
            highlights,
            drawings,
            rectangles,
            circles,
            ellipses,
            lines
        );
    }

    _getStore(uri) {
        if (!this._memory.has(uri)) {
            const bookStore = new Map();
            bookStore.set("HIGHLIGHT", new Map());
            bookStore.set("DRAWING", new Map());
            bookStore.set("RECTANGLE", new Map());
            bookStore.set("ELLIPSE", new Map());
            bookStore.set("CIRCLE", new Map());
            bookStore.set("LINE", new Map());
            this._memory.set(uri, bookStore);
        }

        return this._memory.get(uri);
    }
}

StorageRegistry.instance.add(new InMemStorageAdapter());
