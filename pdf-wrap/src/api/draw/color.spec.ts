import {Color, colorFromHex, colorFromRgba} from "./color";
import * as chai from "chai";

describe("a color class", () => {

    describe('creating a new instance from rgba', () => {

        describe('on valid color values', () => {

            it('should should create a new color instance', () => {

                const [red, green, blue, alpha]: [number, number, number, number] = [255, 0, 0, 1];


                const color: Color = colorFromRgba(red, green, blue, alpha);


                chai.expect(color.hex()).to.equal("#FF0000FF");
            });
        });

        describe('on invalid color values', () => {

            it('should throw a illegal color value error', () => {

                const [red, green, blue, alpha]: [number, number, number, number] = [255, 0, 0, 1];


                chai.expect(() => colorFromRgba(286, green, blue, alpha))
                    .to.throw(Error)
                    .and.to.have.property("message", "Parameter red is not a valid color value: red=286");

                chai.expect(() => colorFromRgba(red, -5, blue, alpha))
                    .to.throw(Error)
                    .and.to.have.property("message", "Parameter green is not a valid color value: green=-5");

                chai.expect(() => colorFromRgba(red, green, 256, alpha))
                    .to.throw(Error)
                    .and.to.have.property("message", "Parameter blue is not a valid color value: blue=256");

                chai.expect(() => colorFromRgba(red, green, blue, 1.8))
                    .to.throw(Error)
                    .and.to.have.property("message", "Parameter alpha is not a valid alpha value: alpha=1.8");
            });
        });
    });

    describe('creating a new instance from hex value', () => {

        describe('on valid hex value', () => {

            it('should create a new color instance', () => {

                const hex: string = "FF0000";


                const color: Color = colorFromHex(hex);


                chai.expect(color.red).to.equal(255);
                chai.expect(color.green).to.equal(0);
                chai.expect(color.blue).to.equal(0);
                chai.expect(color.alpha).to.equal(1);
            });
        });

        describe('on valid short hex value', () => {

            it('should create a new color instance', () => {

                const hex: string = "f00";


                const color: Color = colorFromHex(hex);


                chai.expect(color.red).to.equal(255);
                chai.expect(color.green).to.equal(0);
                chai.expect(color.blue).to.equal(0);
                chai.expect(color.alpha).to.equal(1);
            });
        });

        describe('on valid alpha hex value', () => {

            it('should create a new color instance', () => {

                const hex: string = "ff000080";


                const color: Color = colorFromHex(hex);


                chai.expect(color.red).to.equal(255);
                chai.expect(color.green).to.equal(0);
                chai.expect(color.blue).to.equal(0);
                chai.expect(color.alpha).to.equal(0.5);
            });
        });

        describe('on valid alpha short hex value', () => {

            it('should create a new color instance', () => {

                const hex: string = "f009";


                const color: Color = colorFromHex(hex);


                chai.expect(color.red).to.equal(255);
                chai.expect(color.green).to.equal(0);
                chai.expect(color.blue).to.equal(0);
                chai.expect(color.alpha).to.equal(0.6);
            });
        });

        describe('on leading #', () => {

            it('should create a new color instance', () => {

                const hex: string = "#f009";


                const color: Color = colorFromHex(hex);


                chai.expect(color.red).to.equal(255);
                chai.expect(color.green).to.equal(0);
                chai.expect(color.blue).to.equal(0);
                chai.expect(color.alpha).to.equal(0.6);
            });
        });

        describe('on illegal hex value', () => {

            it('should throw a illegal color value error', () => {

                const illegalHex: string = "h0ff00"; // h is not valid


                chai.expect(() => colorFromHex(illegalHex))
                    .to.throw(Error)
                    .and.to.have.property("message", "Parameter value is not a valid hex color value: value=h0ff00");
            });
        });
    });

    describe('formatted hex value', () => {

        const color: Color = colorFromHex("fc8ac380");

        describe('on #XXXXXX format', () => {

            it('should return the formatted hex value', () => {

                const hex: string = color.hex("#XXXXXX");

                chai.expect(hex).to.equal("#FC8AC3");
            });
        });

        describe('on default format', () => {

            it('should return the formatted hex value', () => {

                const hex: string = color.hex();

                chai.expect(hex).to.equal("#FC8AC380");
            });
        });

        describe('on XXXXXX format', () => {

            it('should return the formatted hex value', () => {

                const hex: string = color.hex("XXXXXX");

                chai.expect(hex).to.equal("FC8AC3");
            });
        });

        describe('on XXXXXXXX format', () => {

            it('should return the formatted hex value', () => {

                const hex: string = color.hex("XXXXXXXX");

                chai.expect(hex).to.equal("FC8AC380");
            });
        });
    });
});
