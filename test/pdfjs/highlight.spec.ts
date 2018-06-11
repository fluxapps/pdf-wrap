import {cleanSelection, HighlightManager} from "../../src/pdfjs/highlight";
import * as chai from "chai";
import {ClientRectangle} from "../../src/pdfjs/client-rectangle";
import {Canvas, PolyLinePainter, RectanglePainter} from "../../src/paint/painters";
import {CanvasElement, CanvasRectangle} from "../../src/paint/canvas.elements";
import {DrawElement, Rectangle} from "../../src/api/draw/elements";
import {colorFrom, Colors} from "../../src/api/draw/color";
import {Target} from "../../src/api/highlight/highlight.api";
import {anyString, anything, deepEqual, instance, mock, verify, when} from "ts-mockito";

function createMockRectangle(): Rectangle {
    return {
        borderColor: colorFrom(Colors.NONE),
        dimension: {width: 2, height: 2},
        fillColor: colorFrom(Colors.YELLOW),
        id: "svg-mock",
        position: {x: 0, y: 0}
    };
}

class MockCanvas implements Canvas {
    polyLine(): PolyLinePainter {
        throw new Error("Not implemented test stub");
    }
    rectangle(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    remove(): void {
        throw new Error("Not implemented test stub");
    }
    select(): Array<CanvasElement<DrawElement>> {
        throw new Error("Not implemented test stub");
    }
}

abstract class MockRectanglePainter implements RectanglePainter {
    borderColor(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    borderWidth(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    dimension(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    fillColor(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    id(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
    paint(): CanvasRectangle {
        throw new Error("Not implemented test stub");
    }
    position(): RectanglePainter {
        throw new Error("Not implemented test stub");
    }
}

describe('a highlight manager', () => {

    describe('clear selection', () => {

        describe('on intersection with existing highlights', () => {

            it('should reduce the highlights by the selection', () => {

                const target: Target = {height: 2, width: 4, x: 5, y: 3};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 5, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.clear();


                verify(existingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 3, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
            });
        });

        describe('on intersection only inside an existing highlight', () => {

            it('should create two new highlights reduced by the selection', () => {

                const target: Target = {height: 2, width: 3, x: 5, y: 3};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 8, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.clear();


                verify(existingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 3, height: 2}))).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 2, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).twice();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 8, y: 3}))).once();
            });
        });

        describe('on selection covers the whole existing highlight', () => {

            it('should only remove the existing highlight and not paint any new one', () => {

                const target: Target = {height: 2, width: 8, x: 2, y: 3};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 2, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 4, y: 3}
                });


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.clear();


                verify(existingHighlight.remove()).once();
                verify(mockCanvas.rectangle()).never();
            });
        });

        describe('on selection outside any existing highlight', () => {

            it('should neither remove or add any highlight', () => {

                const target: Target = {height: 2, width: 8, x: 8, y: 15};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 2, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 4, y: 3}
                });


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.clear();


                verify(existingHighlight.remove()).never();
                verify(mockCanvas.rectangle()).never();
            });
        });
    });

    describe('highlight selection', () => {

        describe('on no intersection with any existing highlight', () => {

            it('should create a new highlight matching the selection', () => {

                const target: Target = {x: 5, y: 3, width: 4, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 2, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 4, y: 9}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.YELLOW));


                verify(existingHighlight.remove()).never();
                verify(mockRectanglePainter.dimension(deepEqual({width: 4, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 5, y: 3}))).once();
            });
        });

        describe('on intersection with existing highlights', () => {

            it('should remove the existing highlight and create a new combined highlight', () => {

                const target: Target = {x: 5, y: 3, width: 4, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);
                const secondExistingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight), instance(secondExistingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 4, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });
                when(secondExistingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 4, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove-2",
                    position: {x: 8, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.YELLOW));


                verify(existingHighlight.remove()).once();
                verify(secondExistingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 10, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
            });
        });

        describe('on intersection with different colors', () => {

            it('should unite the intersections with the same color and subtract the other ones', () => {

                const target: Target = {x: 5, y: 3, width: 4, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);
                const secondExistingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight), instance(secondExistingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 4, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });
                when(secondExistingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 4, height: 2},
                    fillColor: colorFrom(Colors.GREEN),
                    id: "svg-to-remove-2",
                    position: {x: 8, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.YELLOW));


                verify(existingHighlight.remove()).once();
                verify(secondExistingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 7, height: 2}))).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 3, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.GREEN)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 9, y: 3}))).once();
            });
        });

        describe('on intersection inside an existing highlight', () => {

            it('should neither remove or add any highlight', () => {

                const target: Target = {x: 5, y: 3, width: 4, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 8, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 4, y: 3}
                });


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.YELLOW));


                verify(existingHighlight.remove()).never();
                verify(mockCanvas.rectangle()).never();
            });
        });

        describe('on intersection inside an existing highlight, but with different color', () => {

            it('should subtract the selection from the existing highlight and add the selection as new highlight', () => {

                const target: Target = {x: 5, y: 3, width: 3, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 8, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.GREEN));

                verify(existingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 3, height: 2}))).twice();
                verify(mockRectanglePainter.dimension(deepEqual({width: 2, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).twice();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.GREEN)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 8, y: 3}))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 5, y: 3}))).once();

            });
        });

        describe('on selection start exactly at the end of a highlight', () => {

            it('should remove the highlight and add a new combined one', () => {

                const target: Target = {x: 5, y: 3, width: 4, height: 2};

                const mockCanvas: Canvas = mock(MockCanvas);
                const existingHighlight: CanvasRectangle = mock(CanvasRectangle);

                when(mockCanvas.select(anyString())).thenReturn([instance(existingHighlight)]);
                when(existingHighlight.transform()).thenReturn({
                    borderColor: colorFrom(Colors.NONE),
                    dimension: {width: 3, height: 2},
                    fillColor: colorFrom(Colors.YELLOW),
                    id: "svg-to-remove",
                    position: {x: 2, y: 3}
                });

                const newHighlight: CanvasRectangle = mock(CanvasRectangle);
                when(newHighlight.transform()).thenReturn(createMockRectangle());

                const mockRectanglePainter: RectanglePainter = mock(MockRectanglePainter);
                const mockRectanglePainterInst: RectanglePainter = instance(mockRectanglePainter);
                when(mockRectanglePainter.dimension(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.position(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.fillColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.borderColor(anything())).thenReturn(mockRectanglePainterInst);
                when(mockRectanglePainter.paint()).thenReturn(instance(newHighlight));

                when(mockCanvas.rectangle()).thenReturn(mockRectanglePainterInst);


                const manager: HighlightManager = new HighlightManager(instance(mockCanvas), target);
                manager.highlight(colorFrom(Colors.YELLOW));


                verify(existingHighlight.remove()).once();
                verify(mockRectanglePainter.dimension(deepEqual({width: 7, height: 2}))).once();
                verify(mockRectanglePainter.fillColor(deepEqual(colorFrom(Colors.YELLOW)))).once();
                verify(mockRectanglePainter.position(deepEqual({x: 2, y: 3}))).once();
            });
        });
    });
});

describe('clean selections function', () => {

    describe('on more than 85% overlapping selections', () => {

        it('should remove the smaller selection from the output array', () => {

            const a: ClientRectangle = ClientRectangle.fromSize(5, 6, 5, 9);
            const b: ClientRectangle = ClientRectangle.fromSize(5, 7, 6, 10);

            const rects: Array<ClientRect> = [a, b];


            const result: Array<ClientRect> = cleanSelection(rects);


            const expected: Array<ClientRect> = [b];
            chai.expect(result).to.deep.equal(expected);
        });
    });

    describe('on less than 85% overlapping selections', () => {

        it('should not remove any selection', () => {

            const a: ClientRectangle = ClientRectangle.fromSize(5, 6, 5, 9);
            const b: ClientRectangle = ClientRectangle.fromSize(6, 7, 6, 10);

            const rects: Array<ClientRect> = [a, b];


            const result: Array<ClientRect> = cleanSelection(rects);


            const expected: Array<ClientRect> = [a, b];
            chai.expect(result).to.deep.equal(expected);
        });
    });
});
