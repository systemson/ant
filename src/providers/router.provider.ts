import express from "express";
import compression from "compression";
import cors from "cors";
import {
    ServiceProvider,
    RouterFacade,
    routerConfig,
    Logger,
    Lang,
    logCatchedError,
    RouteContract,
    logCatchedException
} from "@ant/framework";
import {
    Response as ExpressResponse,
    Request as ExpressRequest,
} from "express";

export default class RouterProvider extends ServiceProvider {
    protected router = express();

    boot(): Promise<void> {
        return new Promise((resolve) => {
            this.router
                .use(express.json())
                .use(cors())
                .use(compression())
                .use(express.text({ type: "application/xml" }))
            ;

            const config = routerConfig();

            Logger.audit(Lang.__("Routes set up started."));

            this.setRoutes(this.boostrap.routes)
                .then((count: number) => {
                    Logger.audit(Lang.__("Routes set up completed [{{count}}].", {
                        count: count.toString()
                    }));

                    const server = this.router.listen(config.port, () => {
                        Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", config));
                        
                        resolve();
                    });

                    RouterFacade.setInstance(server);
                }, (error) => {
                    Logger.audit(Lang.__(error.message));
                })
                .catch(logCatchedException)
            ;
        });
    }

    /**
     * @todo COULD be moved to a provider.
     * 
     * @param routeClasses 
     * @returns 
     */
    public setRoutes(routeClasses:  (new() => RouteContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (routeClasses.length > 0) {
                for (const routeClass of routeClasses) {
                    const instance = new routeClass();
                    instance.onCreated();

                    const config = routerConfig();

                    const routeData = {
                        name: instance.constructor.name,
                        scheme: config.scheme || "http",
                        host: config.host || "localhost",
                        port: config.port,
                        endpoint: Array.isArray(instance.url) ? instance.url.join(",") : instance.url,
                        method: instance.method.toUpperCase(),
                    };

                    Logger.audit(Lang.__("Preparing route [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));

                    this.router[instance.method](instance.url, (req: ExpressRequest, res: ExpressResponse) => {
                        Logger.debug(Lang.__("Request received in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                        Logger.trace(Lang.__("Client request: "));
                        Logger.trace({
                            url: req.url,
                            method: req.method,
                            clientIp: req.ip,
                            body: req.body,
                            query: req.query,
                            params: req.params,
                            headers: req.headers,
                        });

                        instance.handler(req)
                            .then(handler => {
                                handler.send(res);

                                Logger.debug(Lang.__("Request handled in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                Logger.trace(Lang.__("Server response: "));
                                Logger.trace(handler.getData());

                                instance.onCompleted(req);
                            }, (error) => {
                                res.status(500).send(error);

                                Logger.error(Lang.__("Error handling a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);

                                instance.onFailed(req, error);
                            }).catch((error) => {
                                res.status(500).send(error);

                                instance.onError(error);

                                Logger.error(Lang.__("Unhandled error on a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);
                            })
                        ;
                    });

                    instance.onBooted();
                    Logger.audit(Lang.__("Route [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}] is ready.", routeData));

                }
                resolve(routeClasses.length);
            } else {
                reject({
                    message: "No routes found.",
                });
            }
        });
    }
}
