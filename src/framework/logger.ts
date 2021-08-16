import { getEnv, logCatchedError, now, timestamp, today } from "./helpers";
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
    log(msg: string, level: LOG_LEVEL_NAME, date: string): Promise<void>;
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

    public log(msg: string, level: LOG_LEVEL_NAME, date: string): Promise<void> {
        return new Promise((resolve) => {
            resolve(console.log(
                this.LOG_COLORS[level],
                `[${date}] | ${level.toUpperCase().padEnd(5, " ")} | ${msg}`,
                "\x1b[0m"
            ));
        });
    }
}

export class FileLogger implements LogDriverContract {
    public constructor(
        public folder: string,
        public name: string,
        public dateFormat: string = "YYYY-MM-DD",
    ) {}

    public log(msg: string, level: LOG_LEVEL_NAME, date: string): Promise<void> {
        this.init();

        return new Promise((resolve) => {
            const fileName = `${this.name.toLowerCase()}-${today()}.log`;

            resolve(fs.appendFileSync(
                `${this.folder}/${fileName}`,
                `[${date}] | ${level.toUpperCase().padEnd(5, " ")} | ${msg}` + EOL
            ));
        });
    }

    protected init(): void {
        if (!fs.existsSync(this.folder)){
            fs.mkdirSync(this.folder, { recursive: true });
        }
    }
}

export interface DatabaseLoggerProvider {
    Message: string;
    LogLevel: string;
    Date: Date;

    save(): Promise<any>;
}
export class DatabaseLogger implements LogDriverContract {
    protected messages: DatabaseLoggerProvider[] = [];
    protected initTime: number;
    protected retryUntil: number = 5 * 1000;
    protected isRunning = true;

    public constructor(
        protected loggerClass: new() => DatabaseLoggerProvider
    ) {
        this.initTime = this.unixTS();
    }

    log(msg: string, level: LOG_LEVEL_NAME, date: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                const log = new this.loggerClass();
        
                log.Message = msg;
                log.LogLevel = level.toUpperCase();
                log.Date = new Date(date);
    
                this.messages.push(log);
    
                this.flushLog().then(resolve, reject);
            } else {
                resolve();
            }
        });
    }

    protected async flushLog(): Promise<void> {
        while (this.messages.length >= 1) {
            const log = this.messages.shift() as DatabaseLoggerProvider;

            try {
                await log.save();
            } catch (error) {

                if (this.checkTimeout()) {
                    this.isRunning = false;
                    logCatchedError(error);
                } else {
                    this.messages.push(log);
                }
                break;
            }
        }
    }

    protected checkTimeout(): boolean {
        return this.initTime + this.retryUntil <= this.unixTS();
    }

    protected unixTS(): number {
        return parseInt(now().format("x"));
    }
}
 type LoggerMessage = {
    date: string;
    level: LOG_LEVEL;
    message: string;
}
export class Logger {
    public static instances: {driver: LogDriverContract; can: boolean}[] = [];

    protected static messages: LoggerMessage[] = [];

    public static FATAL: LOG_LEVEL = {
        name: "fatal",
        number: 0
    }
    public static ERROR: LOG_LEVEL = {
        name: "error",
        number: 1
    }
    public static WARN: LOG_LEVEL = {
        name: "warn",
        number: 2
    }
    public static INFO: LOG_LEVEL = {
        name: "info",
        number: 3
    }
    public static DEBUG: LOG_LEVEL = {
        name: "debug",
        number: 4
    }
    public static TRACE: LOG_LEVEL = {
        name: "trace",
        number: 5
    }
    public static AUDIT: LOG_LEVEL = {
        name: "audit",
        number: 6
    }

    public static isReady = false;

    public static log(level: LOG_LEVEL, msg: string): Promise<void> {
        return new Promise((resolve) => {
            if (parseInt(getEnv("APP_LOG_LEVEL", "3")) >= level.number) {
                this.messages.push({
                    date: timestamp(),
                    level: level,
                    message: msg,
                });
                Logger.doLog().then(resolve);
            }
        });
    }

    protected static doLog(): Promise<void> {
        return new Promise((resolve) => {
            if (Logger.isReady) {
                while (Logger.messages.length >= 1) {
                    const message = Logger.messages.shift() as LoggerMessage;
                    for (const instance of Logger.instances) {
                        if (instance.can) {
                            instance.driver
                                .log(message.message, message.level.name, message.date)
                                .then(resolve)
                                .catch(logCatchedError)
                            ;
                        }
                    }
                }
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
