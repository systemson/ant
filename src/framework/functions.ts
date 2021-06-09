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
