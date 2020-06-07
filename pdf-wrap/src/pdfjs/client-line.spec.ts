import * as chai from "chai";
import {ClientLine} from "./client-line";

// tslint:disable: no-unused-expression
describe('a client line', () => {

    describe('an intersection with another client line', () => {

        describe('on intersection', () => {

            it('should return true', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 4, y: 4, z: 0});
                const b: ClientLine = new ClientLine({x: 2, y: 4, z: 0}, {x: 4, y: 2, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.true;
            });

            it('with one parallel line to Y axis should return false', () => {

                const a: ClientLine = new ClientLine({x: 5, y: 2, z: 0}, {x: 5, y: 6, z: 0});
                const b: ClientLine = new ClientLine({x: 3, y: 3, z: 0}, {x: 6, y: 6, z: 0});

                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });
        });

        describe('without intersection', () => {

            it('without parallel lines to Y axis should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 4, y: 4, z: 0});
                const b: ClientLine = new ClientLine({x: 5, y: 5, z: 0}, {x: 6, y: 6, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });

            it('with one parallel line to Y axis should return false', () => {

                const a: ClientLine = new ClientLine({x: 5, y: 4, z: 0}, {x: 5, y: 5, z: 0});
                const b: ClientLine = new ClientLine({x: 5, y: 5, z: 0}, {x: 6, y: 6, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });

            it('with two parallel lines to Y axis should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 2, y: 4, z: 0});
                const b: ClientLine = new ClientLine({x: 3, y: 3, z: 0}, {x: 3, y: 6, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });
        });

        describe('with same start coordinates', () => {

            it('should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 4, y: 4, z: 0});
                const b: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 6, y: 6, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });
        });

        describe('with same end coordinates', () => {

            it('should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 6, y: 6, z: 0});
                const b: ClientLine = new ClientLine({x: 4, y: 4, z: 0}, {x: 6, y: 6, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });
        });

        describe('with theoretical collision', () => {

            it('of b with a should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 6, y: 6, z: 0});
                const b: ClientLine = new ClientLine({x: 1, y: 6, z: 0}, {x: 3, y: 5, z: 0});


                const result: boolean = a.intersectsWith(b);


                chai.expect(result).to.be.false;
            });

            it('of a with b should return false', () => {

                const a: ClientLine = new ClientLine({x: 2, y: 2, z: 0}, {x: 6, y: 6, z: 0});
                const b: ClientLine = new ClientLine({x: 1, y: 6, z: 0}, {x: 3, y: 5, z: 0});


                const result: boolean = b.intersectsWith(a);


                chai.expect(result).to.be.false;
            });
        });
    });
});
