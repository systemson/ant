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

    public setRoutes(routeClasses:  (new() => RouteContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (routeClasses.length > 0) {
                Logger.audit(Lang.__("Routes set up started."));

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

    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (workerClasses.length > 0) {
                Logger.audit(Lang.__("Workers set up started."));

                for (const workerClass of workerClasses) {
                    const instance = new workerClass();

                    const queueName = instance.getQueueName();
        
                    Logger.audit(Lang.__("Preparing worker [{{name}}:{{queue}}].", {
                        name: instance.constructor.name,
                        queue: queueName,
                    }));

                    const queueOptions = {
                        connection: instance.getOptions().connection
                    };

                    QueueEngineFacade.bootQueue(queueName, queueOptions);

                    const concrete = new Worker(
                        queueName,
                        (job: Job) => {
                            Logger.debug(Lang.__("Handling job [{{job}}#{{id}}] on [{{name}}:{{queue}}].", {
                                name: instance.constructor.name,
                                job: job.name,
                                queue: queueName,
                                id: job.id?.toString() as string,
                            }));
                            Logger.trace(JSON.stringify(job, null, 4));

                            return instance.handler(job);
                        },
                        instance.getOptions()
                    );

                    concrete.on("completed", (job: Job, returnValue: any) => {
                        Logger.debug(Lang.__("Job [{{job}}#{{id}}] successfully completed on [{{name}}:{{queue}}]. Returning: {{{data}}}.", {
                            name: instance.constructor.name,
                            job: job.name,
                            queue: queueName,
                            id: job.id?.toString() as string,
                            data: JSON.stringify(returnValue, null, 4),
                        }));
                        Logger.trace(JSON.stringify(job, null, 4));
                    });

                    concrete.on("progress", (job: Job, progress: number | unknown) => {
                        Logger.debug(JSON.stringify(job, null, 4));
                        Logger.trace(JSON.stringify(progress));
                    });

                    concrete.on("failed", (job: Job, failedReason: string) => {
                        Logger.error(Lang.__("Job [{{job}}#{{id}}] failed on [{{name}}:{{queue}}]. {{data}}.", {
                            name: instance.constructor.name,
                            job: job.name,
                            queue: queueName,
                            id: job.id?.toString() as string,
                            data: failedReason,
                        }));

                        Logger.trace(JSON.stringify(job, null, 4));

                        instance.handleFailed(job, failedReason);
                    });

                    concrete.on("error", logCatchedError);

                    concrete.on("drained", () => {
                        Logger.audit(Lang.__("Queue [{{name}}:{{queue}}] is empty.", {
                            name: instance.constructor.name,
                            queue: queueName,
                        }));
                    });
        
                    Logger.audit(Lang.__("Worker [{{name}}:{{queue}}] is ready.", {
                        name: instance.constructor.name,
                        queue: queueName,
                    }));
                }
                resolve(workerClasses.length);
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
