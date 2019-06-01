import {Library} from "svg.js";

declare global {
    interface Window {
        SVG: Library;
    }
}
