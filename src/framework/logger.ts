import { getEnv } from "./functions";

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
    static EXTRA: LOG_LEVEL = {
        name: "trace",
        number: 6
    }

    static log(level: LOG_LEVEL, msg: string): void {
        if ( parseInt(getEnv("APP_LOG_LEVEL", "3")) >= level.number ) {
            const date = new Date();
            
            if (getEnv("APP_CONSOLE_LOG", "false") == "true") {
                console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds().toString().padEnd(3, "0")}] ${level.name.toUpperCase()}:`, msg);
            }
        }
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
}
