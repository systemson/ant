import express from "express";
import compression from "compression";
import cors from "cors";
import {
    ServiceProvider,
    RouterFacade,
    routerConfig,
    Logger,
    Lang
} from "@ant/framework";

export default class RouterProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const router = express();

            router
                .use(express.json())
                .use(cors())
                .use(compression())
                .use(express.text({ type: "application/xml" }))
            ;

            RouterFacade.setInstance(router);

            const config = routerConfig();

            router.listen(config.port, () => {
                Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", config));

                resolve();
            });
        });
    }
}
