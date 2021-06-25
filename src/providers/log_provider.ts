import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import { ConsoleLogger, FileLogger, Logger } from "../framework/logger";

export default class LogProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise(() => {
            Logger.pushDriver(
                new ConsoleLogger(),
                getEnv("APP_CONSOLE_LOG", "false") === "true"
            );

            Logger.pushDriver(
                new FileLogger(getEnv("APP_FILE_LOG_DIR"), getEnv("APP_NAME")),
                getEnv("APP_FILE_LOG", "false") === "true"
            );
        });
    }
}
