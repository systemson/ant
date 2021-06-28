import { getEnv, timestamp, today } from "./helpers";
import fs from "fs";
import { EOL } from "os";

type LOG_LEVEL = {
    name: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "audit";
    number: number;
};

export interface LogDriverContract {
    log(msg: string): Promise<void>;
}

export class ConsoleLogger implements LogDriverContract {
    log(msg: string): Promise<void> {
        return new Promise(() => {
            console.log(msg);
        });
    }

}

export class FileLogger implements LogDriverContract {
    public constructor(
        public folder: string,
        public name: string,
        public dateFormat: string = "YYYY-MM-DD",
    ) {}

    log(msg: string): Promise<void>  {
        return new Promise(() => {
            const fileName = `${this.name.toLowerCase()}-${today()}.log`;

            fs.appendFileSync(`${this.folder}/${fileName}`, msg + EOL);
        });
    }
}

export class Logger {
    protected static instances: {driver: LogDriverContract; can: boolean}[] = [];

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

    static log(level: LOG_LEVEL, msg: string): Promise<void> {
        return new Promise(() => {
            if (parseInt(getEnv("APP_LOG_LEVEL", "3")) >= level.number) {
                this.doLog(timestamp(), level.name.toUpperCase(), msg);
            }
        });
    }

    protected static doLog(date: string, level: string, msg: string): void {
        const logLevel = level.padEnd(5, " ");

        for (const instance of this.instances) {
            if (instance.can) {
                instance.driver.log(`[${date}] | ${logLevel} | ${msg}`);
            }
        }
    }

    static fatal(msg: string): Promise<void>  {
        return this.log(this.FATAL, msg);
    }

    static error(msg: string): Promise<void>  {
        return this.log(this.ERROR, msg);
    }

    static warn(msg: string): Promise<void>  {
        return this.log(this.WARN, msg);
    }

    static info(msg: string): Promise<void>  {
        return this.log(this.INFO, msg);
    }

    static debug(msg: string): Promise<void>  {
        return this.log(this.DEBUG, msg);
    }

    static trace(msg: string): Promise<void>  {
        return this.log(this.TRACE, msg);
    }

    static audit(msg: string): Promise<void>  {
        return this.log(this.AUDIT, msg);
    }

    public static pushDriver(driver: LogDriverContract, can = true): void {
        this.instances.push({driver: driver, can: can});
    }
}
