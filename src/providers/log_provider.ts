import { ServiceProviderContract } from "../bootstrap";
import { getEnv } from "../framework/functions";
import fs from "fs";

export default class FileDirectoryProvider implements ServiceProviderContract {
    protected logDir = getEnv("APP_FILE_LOG_DIR");

    boot(): Promise<void> {
        return new Promise(() => {
            if (!fs.existsSync(this.logDir)){
                fs.mkdirSync(this.logDir);
            }
            if (!fs.existsSync("assets")){
                fs.mkdirSync("assets");
            }
        });
    }
}
