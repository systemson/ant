import { Boostrap } from "../bootstrap";
import { Lang } from "../framework/lang";
import { Logger } from "./logger";
import { QueueEngineFacade, WorkerContract } from "./queue";
import { Response, RouteOptions, RouterConfig, RouteContract } from "./router";
import { Job, Worker } from "bullmq";
import express, { Express } from "express";
import { dummyCallback, getEnv, logCatchedError, logCatchedException } from "./helpers";

export class App {
    routes: Map<string, RouteOptions> = new Map();

    constructor(
        protected router: Express,
        protected config: RouterConfig,
        protected boostrap: Boostrap,
    ) {
        this.init();
    }

    protected startHttpServer(): Promise<void> {
        return new Promise(() => {
            this.router.use(express.json());

            this.router.listen(this.config.port, () => {
                Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", {
                    scheme: this.config.scheme || "http",
                    host: this.config.host || "localhost",
                    port: this.config.port,
                }));
            });
        });
    }

    public setRoutes(routeClasses:  (new() => RouteContract)[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (routeClasses.length > 0) {
                Logger.audit(Lang.__("Routes set up started."));

                for (const routeClass of routeClasses) {
                    const instance = new routeClass() as RouteContract;

                    const routeData = {
                        name: instance.constructor.name,
                        scheme: this.config.scheme || "http",
                        host: this.config.host || "localhost",
                        port: this.config.port,
                        endpoint: instance.url,
                        method: instance.method.toLocaleUpperCase(),
                    };

                    this.router[instance.method](instance.url, (req, res) => {
                        instance.doHandle(req)
                            .then((response: Response) => {
                                res.status(response.getStatus()).header(response.getHeaders()).send(response.getData());

                                Logger.debug(Lang.__("Request handled in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                Logger.trace(JSON.stringify({
                                    url: req.url,
                                    method: req.method,
                                    clientIp: req.ip,
                                    body: req.body,
                                    query: req.query,
                                    params: req.params,
                                }, null, 4));
                            }, (error) => {
                                res.status(500).send(error);

                                Logger.error(Lang.__("Error handling a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);
                            }
                            ).catch((error) => {
                                res.status(500).send(error);

                                Logger.error(Lang.__("Unhandled error on a request in [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}].", routeData));
                                logCatchedError(error);
                            });
                    });

                    Logger.audit(Lang.__("Route [{{name}} => ({{method}}) {{scheme}}://{{host}}:{{port}}{{{endpoint}}}] is ready.", routeData));
                }
                Logger.audit(Lang.__("Routes set up completed."));
                resolve();
            } else {
                const message = "No routes found.";

                Logger.audit(Lang.__(message));
                reject({
                    message: message,
                });
            }
        });
    }

    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<void> {
        return new Promise(() => {
            if (workerClasses.length > 0) {
                Logger.audit(Lang.__("Workers set up started."));

                for (const workerClass of workerClasses) {
                    const instance = new workerClass();

                    const queueName = instance.getQueueName();

                    QueueEngineFacade.bootQueue(queueName, {connection: instance.getOptions().connection});

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
                    });

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

                Logger.audit(Lang.__("Workers set up completed."));
            } else {
                Logger.audit(Lang.__("No workers found."));
            }
        });
    }

    protected async bootProviders(): Promise<void> {
        Logger.audit("Service providers booting started.");

        const promises: Promise<any>[] = [];

        for (const providerClass of this.boostrap.providers) {
            const provider = new providerClass();

            promises.push(provider.init().then((data) => {
                Logger.audit(Lang.__("Booting service provider [{{name}}]", {
                    name: data.name,
                }));
            }));
        }

        await Promise.all(promises);
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
                this.bootProviders().then(() => {
                    Logger.info(Lang.__("Starting [{{name}}] microservice", { name: getEnv("APP_NAME") }));

                    this.setRoutes(this.boostrap.routes)
                        .then(() => {
                            this.startHttpServer().catch(logCatchedException);
                        }, dummyCallback)
                        .catch(logCatchedException)
                    ;
                    this.setWorkers(this.boostrap.workers).catch(logCatchedException);
                });
                
            } catch (error) {
                rejects(error);
            }
            resolve();
        });
    }
}
