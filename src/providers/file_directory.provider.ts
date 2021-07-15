import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import fs from "fs";

export default class FileDirectoryProvider extends ServiceProvider {
    protected logDir = getEnv("APP_FILE_LOG_DIR");

    boot(): Promise<void> {
        return new Promise((resolve) => {
            if (!fs.existsSync(this.logDir)){
                fs.mkdirSync(this.logDir);
            }
            if (!fs.existsSync("assets")){
                fs.mkdirSync("assets");
            }

            resolve();
        });
    }
}