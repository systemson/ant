import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import { Lang } from "../framework/lang";
import path from "path";

export default class LocaleProvider extends ServiceProvider {
    protected logDir = getEnv("APP_FILE_LOG_DIR");

    boot(): Promise<void> {
        return new Promise(() => {
            Lang.configure({
                locales:  getEnv("APP_LOCALEs", "en,es").split(","),
                defaultLocale: getEnv("APP_DEFAULT_LOCALE", "en"),
                directory: path.join(process.cwd(), "assets", "lang"),
                autoReload: true,
                syncFiles: true,
            });
        });
    }
}
