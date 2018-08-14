import * as chai from "chai";
import {ClientRectangle} from "../../src/pdfjs/client-rectangle";

// tslint:disable: no-unused-expression
describe('a client rectangle', () => {

    describe('an intersection with another client rectangle', () => {

        describe('on intersection', () => {

            it('should return true', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: boolean = a.isIntersectedWith(b);


                chai.expect(result).to.be.true;
            });
        });

        describe('on no intersection', () => {

            it('should return false', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(5, 12, 15, 19);


                const result: boolean = a.isIntersectedWith(b);


                chai.expect(result).to.be.false;
            });
        });

        describe('on intersection, but false condition', () => {

            it('should return false', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: boolean = a.isIntersectedWith(b, () => false);


                chai.expect(result).to.be.false;
            });
        });
    });

    describe('an intersection area with another client rectangle', () => {

        describe('on intersection', () => {

            it('should return the intersection area', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: number = a.intersectionAreaOf(b);


                chai.expect(result).to.equal(15);
            });
        });

        describe('on no intersection', () => {

            it('should return 0 as the intersection area', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(5, 12, 15, 19);


                const result: number = a.intersectionAreaOf(b);


                chai.expect(result).to.equal(0);
            });
        });

        describe('on intersection, but false condition', () => {

            it('should return 0 as the intersection area', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: number = a.intersectionAreaOf(b, () => false);


                chai.expect(result).to.equal(0);
            });
        });
    });

    describe('an intersection with another client rectangle', () => {

        describe('on intersection', () => {

            it('should return the intersection as client rectangle', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: ClientRectangle = a.intersectionOf(b);


                const expected: ClientRectangle = ClientRectangle.fromCoordinates(7, 10, 5, 10);
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on no intersection', () => {

            it('should throw an error indicating, that there is no intersection', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(5, 12, 15, 19);


                chai.expect(() => a.intersectionOf(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "No intersection between the two client rectangles exists");
            });
        });
    });

    describe('a percentage intersection with another client rectangle', () => {

        describe('on intersection', () => {

            it('should return the percentage value of the intersection', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: number = a.percentageIntersectionOf(b);


                chai.expect(result).to.equal(0.6);
            });
        });

        describe('on no intersection', () => {

            it('should return a percentage value of 0', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(5, 12, 15, 19);


                const result: number = a.percentageIntersectionOf(b);


                chai.expect(result).to.equal(0);
            });
        });

        describe('on intersection, but false condition', () => {

            it('should return a percentage value of 0', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 4, 11);


                const result: number = a.percentageIntersectionOf(b, () => false);


                chai.expect(result).to.equal(0);
            });
        });
    });

    describe('unite with another rectangle', () => {

        describe('on the right side', () => {

            it('should return the united rectangle', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(8, 17, 5, 10);


                const result: ClientRectangle = a.unite(b);


                const expected: ClientRectangle = ClientRectangle.fromCoordinates(5, 17, 5, 10);
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on the left side', () => {

            it('should return the united rectangle', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 7, 5, 10);


                const result: ClientRectangle = a.unite(b);


                const expected: ClientRectangle = ClientRectangle.fromCoordinates(3, 10, 5, 10);
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on uneven top attribute', () => {

            it('should throw an error indicating that the top attribute must be the same value', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 8, 8, 10);


                chai.expect(() => a.unite(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "Can not unite client rectangles with uneven top or bottom attributes:"
                    + `\n${a.toString()}\n${b.toString()}`);
            });
        });

        describe('on uneven bottom attribute', () => {

            it('should throw an error indicating that the bottom attribute must be the same value', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 8, 5, 15);


                chai.expect(() => a.unite(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "Can not unite client rectangles with uneven top or bottom attributes:"
                    + `\n${a.toString()}\n${b.toString()}`);
            });
        });

        describe('on no intersection between the two rectangles', () => {

            it('should throw an error indicating that the rectangles are not intersected', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 15, 20);


                chai.expect(() => a.unite(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "Can not unite client rectangles with no intersection:"
                    + `\n${a.toString()}\n${b.toString()}`);
            });
        });
    });

    describe('subtract another rectangle', () => {

        describe('on the right side with even top and bottom attributes', () => {

            it('should return one new client rectangle with a reduced right attribute', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 5, 10);


                const result: Array<ClientRectangle> = a.subtract(b);


                const expected: Array<ClientRectangle> = [ClientRectangle.fromCoordinates(5, 7, 5, 10)];
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on the left side with even top and bottom attributes', () => {

            it('should return one new client rectangle with a reduced left attribute', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 7, 5, 10);


                const result: Array<ClientRectangle> = a.subtract(b);


                const expected: Array<ClientRectangle> = [ClientRectangle.fromCoordinates(7, 10, 5, 10)];
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on the middle with even top and bottom attributes', () => {

            it('should return two new client rectangles where the intersection is not part of it', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(3, 15, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(7, 12, 5, 10);


                const result: Array<ClientRectangle> = a.subtract(b);


                const expected: Array<ClientRectangle> = [
                    ClientRectangle.fromCoordinates(3, 7, 5, 10),
                    ClientRectangle.fromCoordinates(12, 15, 5, 10),
                ];
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on subtract more than the whole rectangle with even top and bottom attributes', () => {

            it('should not return any new rectangle', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 12, 5, 10);


                const result: Array<ClientRectangle> = a.subtract(b);


                chai.expect(result).to.deep.equal([]);
            });
        });

        describe('on uneven top attribute', () => {

            it('should throw an error indicating that the top attribute must be the same value', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 12, 2, 10);


                chai.expect(() => a.subtract(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "Can not subtract rectangle with uneven top or bottom attributes:"
                    + `\n${JSON.stringify(a)}\n${JSON.stringify(b)}`);
            });
        });

        describe('on uneven bottom attribute', () => {

            it('should throw an error indicating that the bottom attribute must the same value', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(3, 12, 5, 12);


                chai.expect(() => a.subtract(b))
                    .to.throw(Error)
                    .and.to.have.property("message", "Can not subtract rectangle with uneven top or bottom attributes:"
                    + `\n${JSON.stringify(a)}\n${JSON.stringify(b)}`);
            });
        });

        describe('on no intersection', () => {

            it('should return the same rectangle without any subtracted values', () => {

                const a: ClientRectangle = ClientRectangle.fromCoordinates(5, 10, 5, 10);
                const b: ClientRectangle = ClientRectangle.fromCoordinates(12, 17, 5, 10);


                const result: Array<ClientRectangle> = a.subtract(b);


                chai.expect(result).to.deep.equal([a]);
            });
        });
    });
});
