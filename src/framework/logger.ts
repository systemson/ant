import { getEnv } from "./functions";
import fs from "fs";
import moment from "moment";
import { EOL } from "os";

type LOG_LEVEL = {
    name: string;
    number: number
};

export class Logger {
    static FATAL: LOG_LEVEL = {
        name: "fatal",
        number: 0
    }
    static ERROR: LOG_LEVEL = {
        name: "error",
        number: 1
    }
    static WARN: LOG_LEVEL = {
        name: "warn",
        number: 2
    }
    static INFO: LOG_LEVEL = {
        name: "info",
        number: 3
    }
    static DEBUG: LOG_LEVEL = {
        name: "debug",
        number: 4
    }
    static TRACE: LOG_LEVEL = {
        name: "trace",
        number: 5
    }
    static AUDIT: LOG_LEVEL = {
        name: "audit",
        number: 6
    }

    static log(level: LOG_LEVEL, msg: string): void {
        if ( parseInt(getEnv("APP_LOG_LEVEL", "3")) >= level.number ) {
            this.doLog(moment().format("YYYY-MM-DDTHH:mm:ss.SSS"), level.name.toUpperCase(), msg);
        }
    }

    protected static doLog(date: string, level: string, msg: string): void {
        const logLevel = level.padEnd(5, " ");

        if (getEnv("APP_FILE_LOG", "false") === "true") {
            this.fileLog(`[${date}] | ${logLevel} | ${msg}` + EOL);
        }

        if (getEnv("APP_CONSOLE_LOG", "false") === "true") {
            console.log(`[${date}] | ${logLevel} |`, msg);
        }

    }

    protected static fileLog(msg: string): void {
        const fileName = `${getEnv("APP_NAME").toLowerCase()}-${moment().format("YYYY-MM-DD")}.log`;

        fs.appendFileSync(`${getEnv("APP_FILE_LOG_DIR")}/${fileName}`, msg);
    }

    static fatal(msg: string): void {
        return this.log(this.FATAL, msg);
    }

    static error(msg: string): void {
        return this.log(this.ERROR, msg);
    }

    static warn(msg: string): void {
        return this.log(this.WARN, msg);
    }

    static info(msg: string): void {
        return this.log(this.INFO, msg);
    }

    static debug(msg: string): void {
        return this.log(this.DEBUG, msg);
    }

    static trace(msg: string): void {
        return this.log(this.TRACE, msg);
    }

    static audit(msg: string): void {
        return this.log(this.AUDIT, msg);
    }
}
