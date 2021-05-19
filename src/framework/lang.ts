import path from "path";
import { getEnv } from "./functions";

/**
 * require I18n with capital I as constructor
 */
import { I18n } from "i18n";
 
/**
  * create a new instance
  */
const Lang = new I18n();

/**
  * later in code configure
  */
Lang.configure({
    locales: ["en", "es"],
    defaultLocale: getEnv("APP_LOCALE", "en"),
    directory: path.join(process.cwd(), "assets", "lang"),
    autoReload: true,
    syncFiles: true,
});

export { Lang };
