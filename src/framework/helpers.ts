import fs from "fs";
import { Lang } from "./lang";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";
import { Logger } from "./logger";
import moment, { Moment } from "moment";
import { info } from "console";

const NODE_ENV = process.env.NODE_ENV?.trim();

if (!fs.existsSync(`.env.${NODE_ENV}`) && !fs.existsSync(".env")) {
    throw new Error(`No environment variables file [.env or .env.${NODE_ENV}] found.`);
}
if (process.env.NODE_ENV && fs.existsSync(`.env.${NODE_ENV}`)) {
    dotenvExpand(dotenv.config({ path:  `.env.${NODE_ENV}`}));
} else {
    dotenvExpand(dotenv.config());
}
export function getEnv(key: string, fallback?: string): string {
    return process.env[key] || fallback || "";
}
export function logCatchedException(error?: {message?: string; stack?: string;}): void {
    logCatchedError(error);
    Logger.fatal("An unrecoverable error has occurred. Shutting down application.");
    process.exit(1);
}
export function logCatchedError(error?: {name?: string; message?: string; stack?: string;}): void {
    Logger.error(error?.message || Lang.__("No message provided for this error."));
    Logger.error(error?.stack || Lang.__("No trace stack provided for this error."));
    if (getEnv("APP_MODE") === "develop") {
        Logger.error(JSON.stringify(error, null, 4));
    }
}

export function now(): Moment  {
    return moment();
}
export function dateFormated(format: TIME_FORMAT): string {
    return now().format(format);
}
export function timestamp(): string {
    return dateFormated(TIMESTAMP_FORMAT);
}
export function today(): string {
    return dateFormated(DATE_FORMAT);
}
export function time(): string {
    return dateFormated(HOUR_FORMAT);
}

export type TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ss.SSS" | "YYYY-MM-DD HH:mm:ss.SSS" | "YYYY-MM-DD HH:mm:ss" |"YYYYMMDDHHmmss" | "YYYY-MM-DD" | "YYYY/MM/DD" | "HH:mm:ss" | "HH:mm:ss.SSS" | "HHmmss" | "HHmmssSSS";

export const TIMESTAMP_FORMAT: TIME_FORMAT = "YYYY-MM-DD[T]HH:mm:ss.SSS";
export const DATE_FORMAT: TIME_FORMAT = "YYYY-MM-DD";
export const HOUR_FORMAT: TIME_FORMAT = "HH:mm:ss.SSS";

export function sleep(ms: number): Promise<void> {
    Logger.debug("Esperando " + ms);
    return new Promise((resolve) => {
        setTimeout(resolve, ms, [ms]);
    });
}

export function dummyCallback(...any: unknown[]): void {
    //
}

process.on('SIGINT', () => {
    Logger.info("Gracefully shutting down the application.");
    process.exit(0);
});
