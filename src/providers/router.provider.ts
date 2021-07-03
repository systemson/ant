import { ServiceProvider } from "../framework/service_provider";
import { Logger } from "../framework/logger";
import { Lang } from "../framework/lang";
import express from "express";
import { routerConfig, RouterFacade } from "../framework/router";

export default class RouterProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const router = express();

            router.use(express.json());

            const config = routerConfig();

            router.listen(config.port, () => {
                Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", config));
            });

            RouterFacade.setInstance(router);

            resolve();
        });
    }
}
