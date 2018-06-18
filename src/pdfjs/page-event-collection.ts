import {DrawEvent, PageEventCollection} from "../api/storage/page.event";
import {DrawElement, PolyLine, Rectangle} from "../api/draw/elements";
import {Observable} from "rxjs/internal/Observable";
import {TextSelection} from "../api/highlight/highlight.api";
import {mergeMap} from "rxjs/operators";
import {merge} from "rxjs/internal/observable/merge";

/**
 *
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class PDFjsPageEvenCollection implements PageEventCollection {

    private readonly onHighlightRemove: Observable<DrawEvent<DrawElement>>;
    private readonly onHighlight: Observable<DrawEvent<Rectangle>>;

    constructor(
        private readonly _afterPolyLineRendered: Observable<DrawEvent<PolyLine>>,
        private readonly _afterElementRemoved: Observable<DrawEvent<DrawElement>>,
        onTextSelection: Observable<TextSelection>
    ) {
        this.onHighlightRemove = onTextSelection
            .pipe(mergeMap((it) => it.onRemoveHighlighting));

        this.onHighlight = onTextSelection
            .pipe(mergeMap((it) => it.onHighlighting));
    }

    afterElementRemoved(): Observable<DrawEvent<DrawElement>> {
        return merge(this._afterElementRemoved, this.onHighlightRemove);
    }

    afterPolyLineRendered(): Observable<DrawEvent<PolyLine>> {
        return this._afterPolyLineRendered;
    }

    afterRectangleRendered(): Observable<DrawEvent<Rectangle>> {
        return this.onHighlight;
    }
}
