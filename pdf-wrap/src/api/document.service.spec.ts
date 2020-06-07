import { URI } from "./document.service";
import chai from "chai";

describe('an URI', () => {

    describe('creating a new instance', () => {

        describe('on valid uri value', () => {

            it('should return a new URI instance', () => {

                const uri: URI = URI.from("http://example.com");


                chai.expect(uri.schema).to.equal("http");
                chai.expect(uri.uri).to.equal("http://example.com");
            });
        });

        describe('on only protocol uri value', () => {

            it('should return a new URI instance', () => {

                const uri: URI = URI.from("http://");


                chai.expect(uri.schema).to.equal("http");
                chai.expect(uri.uri).to.equal("http://");
            });
        });

        describe('on invalid uri value', () => {

            it('should throw an illegal uri error', () => {

                chai.expect(() => URI.from("not-valid"))
                    .to.throw(Error)
                    .and.to.have.property("message", "Could not create uri from illegal value: uri=not-valid");
            });
        });
    });
});
