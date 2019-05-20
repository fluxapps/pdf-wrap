
import { Observable, Subject } from "rxjs";
import { Point } from "../../api/draw/draw.basic";
import { DrawEvent } from "../../api/storage/page.event";
import { BorderForm, StandardForm } from "../../api/tool/forms";
import { Color, colorFrom, Colors } from '../../api/draw/color';
import { DocumentModel, Page } from "../document.model";

export abstract class AbstractBorderForm<T> implements BorderForm<T> {

    borderColor: Color = colorFrom(Colors.BLACK);
    borderWith: number = 1;
    protected readonly _afterPaintCompleted: Subject<DrawEvent<T>> = new Subject();

    // tslint:disable-next-line
    readonly afterPaintCompleted: Observable<DrawEvent<T>> = this._afterPaintCompleted.asObservable();

    protected get position(): Point {
        const page: Page = this.document.getPage();
        return {
            x: page.pagePosition.x + (page.pageDimension.width * 0.3),
            y: page.pagePosition.y + (page.pageDimension.height * 0.1),
        };
    }

    protected constructor(protected readonly document: DocumentModel) {

    }

    abstract create(): void;
}

export abstract class AbstractStandardForm<T> extends AbstractBorderForm<T> implements StandardForm<T> {
    fillColor: Color = colorFrom(Colors.BLACK);

}
