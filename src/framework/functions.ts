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

export function logCatchedError(error?: any): void {
    Logger.fatal("An unrecoverable error has occurred. Shutting down application.");
    Logger.fatal(error?.message);
    Logger.error(error?.stack);
    process.exit();
}
