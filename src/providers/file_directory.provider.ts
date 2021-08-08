import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import fs from "fs";

export default class FileDirectoryProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const logDir = getEnv("APP_FILE_LOG_DIR");
            if (!fs.existsSync(logDir)){
                fs.mkdirSync(logDir, { recursive: true });
            }
            if (!fs.existsSync("assets")){
                fs.mkdirSync("assets", { recursive: true });
            }

            resolve();
        });
    }
}
