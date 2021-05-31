import { ServiceProviderContract } from "../bootstrap";
import { getEnv } from "../framework/functions";
import { Lang } from "../framework/lang";
import path from "path";

export default class LocaleProvider implements ServiceProviderContract {
    protected logDir = getEnv("APP_FILE_LOG_DIR");

    boot(): Promise<void> {
        return new Promise(() => {
            Lang.configure({
                locales: ["en", "es"],
                defaultLocale: getEnv("APP_LOCALE", "en"),
                directory: path.join(process.cwd(), "assets", "lang"),
                autoReload: true,
                syncFiles: true,
            });
        });
    }
}
