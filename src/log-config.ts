import {
    LFService, Logger,
    LoggerFactory as TSLoggerFactory,
    LoggerFactoryOptions,
    LogGroupRule,
    LogLevel
} from "typescript-logging";

/**
 * Get access to a logger or configure the logging.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export class LoggerFactory {

    /**
     * Configure the logger used of this logger factory.
     *
     * @param {LogConfig} config - the config to use
     */
    static configure(config: LogConfig): void {

        const options: LoggerFactoryOptions = new LoggerFactoryOptions();

        config.logGroups.forEach((it) => {

            if (!it.logger.startsWith("ch/studerraimann/pdfwrap")) {
                throw new Error("LogGroup#logger must start with: ch/studerraimann/pdfwrap");
            }

            const regex: RegExp = new RegExp(`${this.escapeDots(it.logger)}.+`);
            options.addLogGroupRule(new LogGroupRule(regex, it.logLevel));
        });

        this.factory.configure(options);
    }

    static getLogger(name: string): Logger {
        return this.factory.getLogger(name);
    }

    private static readonly defaultOptions: LoggerFactoryOptions = new LoggerFactoryOptions()
        .addLogGroupRule(new LogGroupRule(/.+/, LogLevel.Warn));

    private static readonly factory: TSLoggerFactory = LFService.createNamedLoggerFactory("LoggerFactory", LoggerFactory.defaultOptions);

    private static escapeDots(value: string): string {
        return value.replace(/\//g, "\\/");
    }
}

/**
 * Describes a log setting for a specific directory with a specific log level.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface LogGroup {
    /**
     * The directory structure of PDF Wrap starting with ch/studerraimann/pdfwrap
     *
     * You can specify each directory, file or class / function of a file as a logger.
     *
     * e.g.
     *  - ch/studerrraimann/pdfwrap/pdfjs for everything inside this directory
     *  - ch/studerraimann/pdfwrap/pdfjs/highlight for everything inside this file
     *  - ch/studerraimann/pdfwrap/pdfjs/highlight:TextHighlighting for the class 'TextHighlighting` of the file 'highlight'
     */
    logger: string;

    /**
     * The log level to use for the specified {@code logger}.
     */
    logLevel: LogLevel;
}

/**
 * Describes a config used for {@link LoggerFactory}.
 *
 * @author Nicolas Märchy <nm@studer-raimann.ch>
 * @since 0.0.1
 */
export interface LogConfig {
    logGroups: Array<LogGroup>;
}
