import { App, setEnv } from "@ant/framework";
import { Boostrap } from "../src/bootstrap";
import { suiteTeardown, suiteSetup } from 'mocha';

export const app = new App(new Boostrap());

setEnv("APP_LOG_LEVEL", "0");
setEnv("APP_LOG_DRIVER", "console");

setEnv("DB_DATABASE", "unit_testing");
setEnv("BD_DEBUG", "false");
setEnv("DB_MIGRATE", "true");

suiteSetup(async () => {
    await app.boot();
});

suiteTeardown(async () => {
    await app.shutDown();
});
