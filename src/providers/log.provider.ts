import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import { ConsoleLogger, DatabaseLogger, FileLogger, Logger } from "../framework/logger";
import { snakeCase } from "typeorm/util/StringUtils";
import { Log } from "../models/log";

export default class LogProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const drivers = getEnv("APP_LOG_DRIVER", "false").split(",");
            if (drivers.includes('console')) {
                Logger.pushDriver(
                    new ConsoleLogger(),
                );
            }

            if (drivers.includes('file')) {
                Logger.pushDriver(
                    new FileLogger(getEnv("APP_FILE_LOG_DIR"), snakeCase(getEnv("APP_NAME"))),
                );
            }

            if (drivers.includes('database')) {
                Logger.pushDriver(
                    new DatabaseLogger(Log),
                );
            }

            if (getEnv("APP_CLEAR_LOG_ON_START") === "true") {
                Logger.clear();
            }

            Logger.isReady = true;
            resolve();
        });
    }
}
