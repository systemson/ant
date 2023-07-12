import express from "express";
import {
    ServiceProvider,
    RouterFacade,
    routerConfig,
    Logger,
    Lang,
    logCatchedError,
    RouteContract,
    logCatchedException,
    MiddlewareContract
} from "@ant/framework";
import {
    Response as ExpressResponse,
    Request as ExpressRequest,
    RequestHandler
} from "express";
import { GlobalMiddlewares } from "../http/middlewares/global.middleware";

export default class RouterProvider extends ServiceProvider {
    protected router = express();
    protected middlewares: (new () => MiddlewareContract)[] = [
        ...GlobalMiddlewares,
    ];

    boot(): Promise<void> {
        return new Promise((resolve) => {
            this.router
                .use(this.instanceMiddlewares(this.middlewares))
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

                    this.router[instance.method](instance.url, this.instanceMiddlewares(instance.middlewares), (req: ExpressRequest, res: ExpressResponse) => {
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

    protected instanceMiddlewares(middlewares: (new () => MiddlewareContract)[]): RequestHandler[] {
        return middlewares.map(middleware => (new middleware).handle);
    }

    public static getToken(req: ExpressRequest, type: "bearer" | "basic" = "bearer"): string | undefined {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return undefined;
        }
        const parts = authorizationHeader.split(' ');
        if (parts.length !== 2 || parts[0].toLowerCase() !== type) {
            return undefined;
        }
        return parts[1];
    }
}
