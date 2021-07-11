import { getEnv, logCatchedError, logCatchedException, timestamp, today } from "./helpers";
import fs from "fs";
import { EOL } from "os";

const LOG_COLORS = {
    danger: "\x1b[31m", // red
    success: "\x1b[32m", // green
    warning: "\x1b[33m", // yellow
    primary: "\x1b[34m", // blue
    info: "\x1b[36m", // cyan
    secondary: "\x1b[37m",
};

type LOG_LEVEL_NAME = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "audit";

type LOG_LEVEL = {
    name: LOG_LEVEL_NAME;
    number: number;
};

export interface LogDriverContract {
    log(msg: string, level?: LOG_LEVEL): Promise<void>;
}

export class ConsoleLogger implements LogDriverContract {
    protected LOG_COLORS = {
        fatal: LOG_COLORS.danger,
        error: LOG_COLORS.danger,
        warn: LOG_COLORS.warning,
        info: LOG_COLORS.success,
        debug: LOG_COLORS.info,
        trace: LOG_COLORS.warning,
        audit: LOG_COLORS.secondary,
    }
    log(msg: string, level: LOG_LEVEL): Promise<void> {
        return new Promise(() => {
            console.log(this.LOG_COLORS[level.name],  msg, "\x1b[0m");
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
        this.init(this.folder);

        return new Promise(() => {
            const fileName = `${this.name.toLowerCase()}-${today()}.log`;

            fs.appendFileSync(`${this.folder}/${fileName}`, msg + EOL);
        });
    }

    protected init(logDir: string): void {
        if (!fs.existsSync(logDir)){
            fs.mkdirSync(logDir);
        }
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

    static isReady = false;

    static log(level: LOG_LEVEL, msg: string): Promise<void> {
        return new Promise((resolve) => {
            if (parseInt(getEnv("APP_LOG_LEVEL", "3")) >= level.number) {
                Logger.doLog(timestamp(), level, msg).then(() => {
                    resolve();
                }).catch(logCatchedException);
            }
        });
    }

    protected static doLog(date: string, level: LOG_LEVEL, msg: string): Promise<void> {
        return new Promise((resolve) => {
            if (Logger.isReady) {
                for (const instance of Logger.instances) {
                    if (instance.can) {
                        instance.driver
                            .log(`[${date}] | ${level.name.padEnd(5, " ")} | ${msg}`, level)
                            .then(resolve)
                            .catch(logCatchedError)
                        ;
                    }
                }
            } else {
                setTimeout(() => Logger.doLog(date, level, msg), 100);
            }
        });
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
