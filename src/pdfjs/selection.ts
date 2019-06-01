import { merge, Observable, Subject } from "rxjs";
import { map, takeUntil } from "rxjs/operators";
import { Color, colorFrom, Colors } from "../api/draw/color";
import { BorderElement, DrawElement, Form } from "../api/draw/elements";
import { ElementSelection } from "../api/selection/selection.api";
import { CanvasBorderElement, CanvasFormElement } from "../paint/canvas.elements";
import { BoxDragData, PaintEvent } from "../paint/events";
import { Page } from "./document.model";

export interface Disposable {
    dispose(): void;
}

export class BorderElementSelection<R extends BorderElement, T extends CanvasBorderElement<R>> implements ElementSelection, Disposable {

    get fillColor(): Color {
        this.validateState();
        return colorFrom(Colors.BLACK);
    }

    set fillColor(_: Color) {
        this.validateState();
    }

    readonly afterElementModified: Observable<R>;
    readonly afterElementRemoved: Observable<DrawElement>;
    /**
     * The Position change effects every element so everything has to be emitted again ...
     */
    readonly afterPositionChange: Observable<boolean>;
    protected transformedElement: R;
    protected disposed: boolean = false;
    protected readonly _afterElementModified: Subject<R> = new Subject();
    protected readonly _afterElementRemoved: Subject<DrawElement> = new Subject();
    private readonly _afterPositionChange: Subject<boolean> = new Subject();

    private readonly disposed$: Subject<boolean> = new Subject();

    get borderColor(): Color {
        this.validateState();
        return this.transformedElement.borderColor;
    }

    set borderColor(value: Color) {
        this.validateState();
        this._afterElementRemoved.next(this.transformedElement);
        this.selection.borderColor = value;
        this.transformedElement = this.selection.transform();
        this._afterElementModified.next(this.transformedElement);

    }

    get borderWidth(): number {
        this.validateState();
        return this.transformedElement.borderWidth;
    }

    set borderWidth(value: number) {
        this.validateState();
        this._afterElementRemoved.next(this.transformedElement);
        this.selection.borderWidth = value;
        this.transformedElement = this.selection.transform();
        this._afterElementModified.next(this.transformedElement);
    }

    constructor(protected readonly page: Page, protected readonly selection: T) {
        this.afterElementRemoved = this._afterElementRemoved.asObservable();
        this.afterElementModified = this._afterElementModified.asObservable();
        this.afterPositionChange = this._afterPositionChange.asObservable();
        this.transformedElement = this.selection.transform();

        // Subscribe to events which indicate a transformation of the selection.
        const dragEnd: Observable<CustomEvent<Readonly<BoxDragData>>> = this.selection.on(PaintEvent.DRAG_END);
        const resizeEnd: Observable<CustomEvent<null>> = this.selection.on(PaintEvent.RESIZE_END);
        merge(dragEnd, resizeEnd)
            .pipe(
                map(() => this.selection.transform()),
                takeUntil(this.disposed$)
            ).subscribe((it) => {
                this._afterElementRemoved.next(this.transformedElement);
                this.transformedElement = it;
                this._afterElementModified.next(it);
        });
    }

    backwards(): void {
        this.selection.backwards();
        this.transformedElement = this.selection.transform();
        this._afterPositionChange.next(true);
    }

    forwards(): void {
        this.selection.forwards();
        this.transformedElement = this.selection.transform();
        this._afterPositionChange.next(true);
    }

    toBack(): void {
        this.selection.toBack();
        this.transformedElement = this.selection.transform();
        this._afterPositionChange.next(true);
    }

    toFront(): void {
        this.selection.toFront();
        this.transformedElement = this.selection.transform();
        this._afterPositionChange.next(true);
    }

    delete(): void {
        const element: DrawElement = this.selection.transform();
        this.selection.remove();
        this._afterElementRemoved.next(element);
        this.dispose();

    }

    dispose(): void {
        if (!this._afterElementRemoved.closed) {
            this._afterElementModified.complete();
        }
        if (!this._afterElementRemoved.closed) {
            this._afterElementRemoved.complete();
        }

        if (!this.disposed$.closed) {
            this.disposed$.next(true);
            this.disposed$.complete();
        }

        this.selection.resizable = false;
        this.selection.draggable = false;
        this.selection.selected = false;

        this.disposed = true;
    }

    protected validateState(): void {
        if (this.disposed) { throw new Error("Selection does no longer exist!"); }
    }
}

export class FormElementSelection<R extends Form, T extends CanvasFormElement<R>> extends BorderElementSelection<R, T> {

    constructor(page: Page, selection: T) {
        super(page, selection);
    }

    get fillColor(): Color {
        this.validateState();
        return this.transformedElement.fillColor;
    }

    set fillColor(value: Color) {
        this.validateState();
        this._afterElementRemoved.next(this.transformedElement);
        this.selection.fillColor = value;
        this.transformedElement = this.selection.transform();
        this._afterElementModified.next(this.transformedElement);
    }

}
