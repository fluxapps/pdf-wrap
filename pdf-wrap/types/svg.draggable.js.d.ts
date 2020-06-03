declare module "svg.draggable.js" {
    export class DragHandler {

        constructor(readonly el: svgjs.Element);

        // Enables or disabled drag based on input
        init(enabled: boolean): void;

        // Start dragging
        startDrag(ev: svgjs.Element): void;

        // While dragging
        drag(ev: svgjs.Element): svgjs.Box;

        move(x: number, y: number): void;

        endDrag(ev: svgjs.Element): void;
    }
}
