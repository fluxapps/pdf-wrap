/*
 * Type declarations of libraries with no type definitions
 */

// Log4js-api - https://github.com/log4js-node/log4js-api
declare module "@log4js-node/log4js-api" {

    export function getLogger(name: string): Logger;

    export interface Logger {
        trace(msg: string): void;
        info(msg: string): void;
        warn(msg: string): void;
        error(msg: string): void;
        fatal(msg: string): void;
    }
}
