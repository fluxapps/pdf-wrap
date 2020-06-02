
import { Observable, Subject } from "rxjs";
import { Point } from "../../api/draw/draw.basic";
import { DrawEvent } from "../../api/storage/page.event";
import { FormToolConfig } from "../../api/tool";
import { BorderFormTool, StandardFormTool } from "../../api/tool/forms";
import { Color, colorFrom, Colors } from '../../api/draw/color';
import { DocumentModel, Page } from "../document.model";

export abstract class AbstractBorderForm<T, C = FormToolConfig> implements BorderFormTool<T, C> {

    borderColor: Color = colorFrom(Colors.BLACK);
    borderWith: number = 1;
    protected readonly _afterPaintCompleted: Subject<DrawEvent<T>> = new Subject<DrawEvent<T>>();

    // tslint:disable-next-line
    readonly afterPaintCompleted: Observable<DrawEvent<T>> = this._afterPaintCompleted.asObservable();

    protected get position(): Point {

        const page: Page = this.document.getPage();
        const cStyle: CSSStyleDeclaration = getComputedStyle(page.container);
        const containerTemp: DOMRect = page.container.getBoundingClientRect();
        const container: DOMRect = new DOMRect(
            containerTemp.x + parseInt(cStyle.borderLeftWidth, 10),
            containerTemp.y + parseInt(cStyle.borderTopWidth, 10),
            containerTemp.width - parseInt(cStyle.borderLeftWidth, 10) - parseInt(cStyle.borderRightWidth, 10),
            containerTemp.height - parseInt(cStyle.borderTopWidth, 10) - parseInt(cStyle.borderBottomWidth, 10)
        );
        const viewer: DOMRect = this.document.viewer.getBoundingClientRect();
        const intersection: DOMRect = this.calculateRectangleIntersection(container, viewer);
        const translated: DOMRect = this.translateToPageCoordinate(intersection, container);

        // width and height are only the visible part of the page! start viewer to page end!
        // therefore visible part / 2 + distance to page edge.
        return {
            x: (translated.width * 0.5) + translated.x,
            y: (translated.height * 0.5) + translated.y,
            z: -1
        };
    }

    protected constructor(protected readonly document: DocumentModel) {

    }

    abstract create(config?: Partial<C>): void;

    private calculateRectangleIntersection(rectA: DOMRect, rectB: DOMRect): DOMRect {
        const x: number = Math.max(rectA.x, rectB.x);
        const y: number = Math.max(rectA.y, rectB.y);
        const width: number = Math.min(rectA.right - x, rectB.right - x);
        const height: number = Math.min(rectA.bottom - y, rectB.bottom - y);
        return  new DOMRect(
            x,
            y,
            width,
            height
        );
    }

    private translateToPageCoordinate(rect: DOMRect, pagePosition: DOMRect): DOMRect {

        /*
            Source: https://www.math10.com/en/geometry/analytic-geometry/geometry1/coordinates-transformation.html
            where (x, y) are old coordinates [i.e. coordinates relative to xy system],
            (xp,yp) are new coordinates [relative to xp yp system] and (x0, y0) are the coordinates of the new origin 0'
            relative to the old xy coordinate system.
         */
        const x0: number = pagePosition.x;
        const y0: number = pagePosition.y;
        const x: number = rect.x;
        const y: number = rect.y;
        const xp: number = x - x0;
        const yp: number = y - y0;

        return new DOMRect(
            xp,
            yp,
            rect.width,
            rect.height
            );
    }
}

export abstract class AbstractStandardForm<T, C = FormToolConfig> extends AbstractBorderForm<T, C> implements StandardFormTool<T, C> {
    fillColor: Color = colorFrom(Colors.BLACK);

}
