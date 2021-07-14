import { Boostrap } from "../bootstrap";
import { Lang } from "../framework/lang";
import { Logger } from "./logger";
import { QueueEngineFacade, WorkerContract } from "./queue";
import { Response, RouteOptions, RouteContract, routerConfig, RouterFacade } from "./router";
import { Job, Worker } from "bullmq";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { getEnv, logCatchedError, logCatchedException } from "./helpers";

export class App {
    routes: Map<string, RouteOptions> = new Map();

    constructor(
        protected boostrap: Boostrap,
    ) {
        this.init();
    }

    /**
     * @todo SHOULD be moved to a provider.
     * 
     * @param routeClasses 
     * @returns 
     */
    public setRoutes(routeClasses:  (new() => RouteContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (routeClasses.length > 0) {
                for (const routeClass of routeClasses) {
                    const instance = new routeClass() as RouteContract;
                    const config = routerConfig();

                    const routeData = {
                        name: instance.constructor.name,
                        scheme: config.scheme || "http",
                        host: config.host || "localhost",
                        port: config.port,
                        endpoint: instance.url,
                        method: instance.method.toLocaleUpperCase(),
                    };
                    Logger.audit(Lang.__("Preparing route [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));

                    const router = RouterFacade.getInstance();

                    router[instance.method](instance.url, (req: ExpressRequest, res: ExpressResponse) => {
                        Logger.debug(Lang.__("Request received in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                        Logger.trace(Lang.__("Client request: ") + JSON.stringify({
                            url: req.url,
                            method: req.method,
                            clientIp: req.ip,
                            body: req.body,
                            query: req.query,
                            params: req.params,
                            headers: req.headers,
                        }, null, 4));

                        instance.doHandle(req)
                            .then((handler: Response) => {
                                handler.send(res);

                                Logger.debug(Lang.__("Request handled in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                Logger.trace(Lang.__("Server response: ") + JSON.stringify(handler.getData(), null, 4));

                                instance.onCompleted(req);
                            }, (error) => {
                                res.status(500).send(error);

                                Logger.error(Lang.__("Error handling a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);

                                instance.onFailed(req);
                            }).catch((error) => {
                                res.status(500).send(error);

                                Logger.error(Lang.__("Unhandled error on a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);
                            })
                        ;
                    });

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

    /**
     * @todo SHOULD be moved to a provider.
     * 
     * @param workerClasses 
     * @returns 
     */
    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (workerClasses.length > 0) {
                const promises: Promise<any>[] = [];

                for (const [index, workerClass] of Object.entries(workerClasses)) {
                    const instance = new workerClass();

                    const queueName = instance.getQueueName();
        
                    Logger.audit(Lang.__("Preparing worker [{{name}}:{{queue}}].", {
                        name: instance.constructor.name,
                        queue: queueName,
                    }));

                    const queueOptions = {
                        connection: instance.getOptions().connection
                    };

                    promises[parseInt(index)] = QueueEngineFacade.bootQueue(queueName, queueOptions).then(() => {

                        const concrete = new Worker(
                            queueName,
                            (job: Job) => {
                                Logger.debug(Lang.__(
                                    "Handling job [{{job}}#{{id}}] on [{{name}}:{{queue}}].",
                                    instance.getWorkerData(job)
                                ));

                                Logger.trace(JSON.stringify(job, null, 4));
    
                                return instance.handler(job);
                            },
                            instance.getOptions()
                        );
    
                        concrete.on("completed", (job: Job, returnValue: unknown) => {
                            instance.onCompleted(job, returnValue);
                        });

                        concrete.on("progress", (job: Job<any, any, string>, progress: unknown) => {
                            instance.onProgress(job, progress);
                        });

                        concrete.on("failed", (job: Job, failedReason: Error) => {
                            instance.onFailed(job, failedReason);
                        });

                        concrete.on("drained", () => instance.onDrained());

                        concrete.on("error", logCatchedError);
            
                        Logger.audit(Lang.__("Worker [{{name}}:{{queue}}] is ready.", {
                            name: instance.constructor.name,
                            queue: queueName,
                        }));
                    });
                }

                Promise.all(promises).then(() => {
                    resolve(workerClasses.length);
                });

            } else {
                reject({
                    message: "No workers found.",
                });
            }
        });
    }

    protected async bootProviders(): Promise<void> {
        Logger.audit("Service providers booting started.");

        const promises: Promise<any>[] = [];

        for (const providerClass of this.boostrap.providers) {
            const provider = new providerClass();

            promises.push(
                provider.init().then((data) => {
                    Logger.audit(Lang.__("Booting service provider [{{name}}]", {
                        name: data.name,
                    }));
                })
                    .catch(logCatchedException)
            );
        }

        await Promise.all(promises).catch(logCatchedException);

        Logger.audit(Lang.__("Service providers booting completed."));
    }



    /**
     * Prepares the application.
     */
    public init(): void {
        //
    }
    

    /**
     * Sets ready the application's components.
     */
    public boot(): Promise<void> {
        return new Promise((resolve, rejects) => {
            try {
                this.bootProviders().then(async () => {
                    Logger.info(Lang.__("Starting [{{name}}] microservice", { name: getEnv("APP_NAME") }));

                    Logger.audit(Lang.__("Routes set up started."));
                    await this.setRoutes(this.boostrap.routes)
                        .then((count: number) => {
                            Logger.audit(Lang.__("Routes set up completed [{{count}}].", {
                                count: count.toString()
                            }));
                        }, (error) => {
                            Logger.audit(Lang.__(error.message));
                        })
                        .catch(logCatchedException)
                    ;

                    Logger.audit(Lang.__("Workers set up started."));
                    await this.setWorkers(this.boostrap.workers)
                        .then((count: number) => {
                            Logger.audit(Lang.__("Workers set up completed [{{count}}].", {
                                count: count.toString()
                            }));
                        }, (error) => {
                            Logger.audit(Lang.__(error.message));
                        })
                        .catch(logCatchedException)
                    ;
                }).catch(logCatchedException);

            } catch (error) {
                rejects(error);
            }
            resolve();
        });
    }
}
