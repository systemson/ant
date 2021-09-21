import { ServiceProvider } from "../framework/service_provider";
import { Logger } from "../framework/logger";
import express from "express";
import { routerConfig, RouterFacade } from "../framework/router";
import { Lang } from "../framework/helpers";
import cors from 'cors';

export default class RouterProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const router = express();

            router
                .use(express.json())
                .use(cors())
            ;

            const config = routerConfig();

            router.listen(config.port, () => {
                Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", config));
            });

            RouterFacade.setInstance(router);

            resolve();
        });
    }
}
