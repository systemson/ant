import fs from "fs";
if (!fs.existsSync(".env")) {
    throw new Error("No environment variables file [.env] found.");
}

import dotenv from "dotenv";
import { Logger } from "./logger";
dotenv.config();

export function getEnv(key: string, fallback?: string): string {
    return process.env[key] || fallback || "";
}

export function logCatchedException(error?: {message?: string; stack?: string;}): void {
    logCatchedError(error);
    Logger.fatal("An unrecoverable error has occurred. Shutting down application.");
    process.exit();
}
export function logCatchedError(error?: {message?: string; stack?: string;}): void {
    Logger.error(error?.message || "");
    Logger.trace(error?.stack || "");
}

import { DateTime } from "luxon";
export function now(): DateTime {
    return DateTime.now();
}

export function dateFormated(format: TIME_FORMAT): string {
    return DateTime.now().toFormat(format);
}

export function timestamp(): string {
    return dateFormated(TIMESTAMP_FORMAT);
}

export type TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS" | "yyyy-MM-dd HH:mm:ss.SSS" | "yyyy-MM-dd HH:mm:ss" |"yyyyMMddHHmmss" | "yyyy-MM-dd" | "yyyy/MM/dd" | "HH:mm:ss" | "HH:mm:ss.SSS" | "HHmmss" | "HHmmssSSS";

export const TIMESTAMP_FORMAT: TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";
export const DATE_FORMAT: TIME_FORMAT = "yyyy-MM-dd";
export const HOUR_FORMAT: TIME_FORMAT = "HH:mm:ss.SSS";
