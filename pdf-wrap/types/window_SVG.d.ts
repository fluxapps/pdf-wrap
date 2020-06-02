import {Library} from "svg.js";

declare global {
    interface Window {
        SVG: Library;
    }
    declare namespace NodeJS {
        interface Global {
            SVG: Library;
        }
    }
}
