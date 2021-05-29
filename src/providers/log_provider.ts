import { ServiceProviderContract } from "../bootstrap";
import { getEnv } from "../framework/functions";
import fs from "fs";

export default class LogProvider implements ServiceProviderContract {
    protected logDir = getEnv("APP_FILE_LOG_DIR");

    boot(): void {
        if (!fs.existsSync(this.logDir)){
            fs.mkdirSync(this.logDir);
        }
    }
}
