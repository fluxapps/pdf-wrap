import {Outline, OutlineEntry, TreeOutlineEntry} from "../../../src/api/document/document.info";
import * as chai from "chai";


describe('a outline', () => {

    describe('given a flat list', () => {

        describe('on a flat tree hierarchy', () => {

            it('should return the tree hierarchy as a flat list', () => {

                const tree: Array<TreeOutlineEntry> = [
                    new TreeOutlineEntry("1. Chapter", 1),
                    new TreeOutlineEntry("2. Chapter", 5),
                    new TreeOutlineEntry("3. Chapter", 11),
                    new TreeOutlineEntry("4. Chapter", 19),
                ];

                const outline: Outline = new Outline(tree);


                const result: Array<OutlineEntry> = outline.flatList;


                const expected: Array<OutlineEntry> = [
                    new OutlineEntry("1. Chapter", 1),
                    new OutlineEntry("2. Chapter", 5),
                    new OutlineEntry("3. Chapter", 11),
                    new OutlineEntry("4. Chapter", 19),
                ];
                chai.expect(result).to.deep.equal(expected);
            });
        });

        describe('on a deep tree hierarchy', () => {

            it('should return the tree hierarchy as a flat list', () => {

                const tree: Array<TreeOutlineEntry> = [
                    new TreeOutlineEntry("1. Chapter", 1, [
                        new TreeOutlineEntry("1.1 Chapter", 2),
                        new TreeOutlineEntry("1.2 Chapter", 4),
                    ]),
                    new TreeOutlineEntry("2. Chapter", 5, [
                        new TreeOutlineEntry("2.1 Chapter", 6),
                        new TreeOutlineEntry("2.2 Chapter", 8, [
                            new TreeOutlineEntry("2.2.1 Chapter", 9),
                            new TreeOutlineEntry("2.2.2 Chapter", 10),
                        ]),
                    ]),
                    new TreeOutlineEntry("3. Chapter", 11),
                    new TreeOutlineEntry("4. Chapter", 19, [
                        new TreeOutlineEntry("4.1 Chapter", 20),
                    ]),
                ];

                const outline: Outline = new Outline(tree);


                const result: Array<OutlineEntry> = outline.flatList;


                const expected: Array<OutlineEntry> = [
                    new OutlineEntry("1. Chapter", 1),
                    new OutlineEntry("1.1 Chapter", 2),
                    new OutlineEntry("1.2 Chapter", 4),
                    new OutlineEntry("2. Chapter", 5),
                    new OutlineEntry("2.1 Chapter", 6),
                    new OutlineEntry("2.2 Chapter", 8),
                    new OutlineEntry("2.2.1 Chapter", 9),
                    new OutlineEntry("2.2.2 Chapter", 10),
                    new OutlineEntry("3. Chapter", 11),
                    new OutlineEntry("4. Chapter", 19),
                    new OutlineEntry("4.1 Chapter", 20),
                ];
                chai.expect(result).to.deep.equal(expected);
            });
        });
    });
});