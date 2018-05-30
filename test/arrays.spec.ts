import {pairwise} from "../src/arrays";
import * as chai from "chai";

describe('a pairwise function', () => {

    describe('on 2 elements', () => {

        it('should return an array of one tuple', () => {

            const list: Array<string> = ["a", "b"];


            const result: Array<[string, string]> = pairwise(list);


            const expected: Array<[string, string]> = [["a", "b"]];
            chai.expect(result).to.deep.equal(expected);
        });
    });

    describe('on a even number of elements', () => {

        it('should return an array of tuples', () => {

            const list: Array<string> = ["a", "b", "c", "d", "e", "f", "g", "h"];


            const result: Array<[string, string]> = pairwise(list);


            const expected: Array<[string, string]> = [["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]];
            chai.expect(result).to.deep.equal(expected);
        });
    });

    describe('on an uneven number of elements', () => {

        it('should return an array of tubles, but without the last element', () => {

            const list: Array<string> = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];


            const result: Array<[string, string]> = pairwise(list);


            const expected: Array<[string, string]> = [["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]];
            chai.expect(result).to.deep.equal(expected);
        });
    });
});
