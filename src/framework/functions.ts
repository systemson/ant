import dotenv from "dotenv";
dotenv.config();

export function getEnv(key: string, fallback?: string): string {
    return process.env[key] || fallback || "";
}
