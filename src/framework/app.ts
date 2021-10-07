import { Boostrap } from "../bootstrap";
import { Logger } from "./logger";
import { QueueEngineFacade, WorkerContract } from "./queue";
import { Response, RouteOptions, RouteContract, routerConfig, RouterFacade } from "./router";
import { Job, QueueOptions, Worker } from "bullmq";
import { Response as ExpressResponse, Request as ExpressRequest } from "express";
import { getEnv, Lang, logCatchedError, logCatchedException, NODE_ENV } from "./helpers";
import { ServiceProviderContract } from "./service_provider";

export class App {
    routes: Map<string, RouteOptions> = new Map();

    public isRunning: boolean = false;

    constructor(
        protected boostrap: Boostrap,
    ) {
        this.init();
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
     * @todo COULD be moved to a provider.
     * 
     * @param workerClasses
     * @returns 
     */
    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (workerClasses.length > 0) {

                for (const workerClass of workerClasses) {
                    for (let id = 0; id < parseInt(getEnv("APP_QUEUE_WORKERS_CONCURRENCY", "1")); id++) {
                        const instance = new workerClass();
                        instance.setId(id + 1);

                        const queueName = instance.getQueueName();
            
                        Logger.audit(Lang.__("Preparing worker [{{name}}(#{{id}}):{{queue}}].", {
                            name: instance.constructor.name,
                            queue: queueName,
                            id: instance.getId().toString()
                        }));

                        const queueOptions = instance.getOptions() as QueueOptions;
                        
                        QueueEngineFacade.bootQueue(queueName, queueOptions);

                        const concrete = new Worker(
                            queueName,
                            (job: Job) => {
                                Logger.debug(Lang.__(
                                    "Handling job [{{jobName}}#{{jobId}}] on [{{name}}:{{queue}}].",
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

                        concrete.on("progress", (job: Job, progress: unknown) => {
                            instance.onProgress(job, progress);
                        });

                        concrete.on("failed", (job: Job, failedReason: Error) => {
                            instance.onFailed(job, failedReason);
                        });

                        concrete.on("drained", () => instance.onDrained());

                        concrete.on("error", logCatchedError);

                        Logger.audit(Lang.__("Worker [{{name}}(#{{id}}):{{queue}}] is ready.", {
                            name: instance.constructor.name,
                            queue: queueName,
                            id: instance.getId().toString()
                        }));

                        if (getEnv("APP_QUEUE_REMOVE_FAILED_ON_START") === "true") {
                            QueueEngineFacade.getInstance(queueName).clean(5 * 60 * 1000, 0, "failed").then(() => {
                                resolve(workerClasses.length);
                            });
                        } else {
                            resolve(workerClasses.length);
                        }
                    }
                }

            } else {
                reject({
                    message: "No workers found.",
                });
            }
        });
    }

    /**
     * 
     */
    protected async bootProviders(): Promise<void> {
        Logger.audit("Service providers booting started.");

        while (this.boostrap.providers.length > 0) {
            await this.bootNext();
        }

        Logger.audit(Lang.__("Service providers booting completed."));
    }

    /**
     *
     */
    protected async bootNext(): Promise<void> {
        const providerClass = this.boostrap.providers.shift() as new() =>  ServiceProviderContract;
        const provider = new providerClass();

        Logger.audit(Lang.__("Botting service provider [{{name}}].", {
            name: provider.constructor.name,
        }));

        await provider.boot().catch(logCatchedException);
        Logger.audit(Lang.__("Service provider [{{name}}] booted.", {
            name: provider.constructor.name,
        }));
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
                    Logger.info(Lang.__("Starting [{{name}}] application.", { name: getEnv("APP_NAME") }));

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

                    Logger.info(Lang.__("[{{name}}] application running.", { name: getEnv("APP_NAME") }));
                    this.isRunning = true;

                    Logger.audit(Lang.__("Node enviroment [{{env}}].", { env:  NODE_ENV }));

                    resolve();
                }).catch(logCatchedException);

            } catch (error) {
                rejects(error);
            }
        });
    }

    /**
     * Gracefully shuts down the applicxations
     * 
     * @todo SHOULD validate that no workers are running before shut down.
     */
    public shutDown(): Promise<void> {
        return new Promise((resolve) => {
            Logger.info("Gracefully shutting down the application.");

            if (this.isRunning) {
                QueueEngineFacade.stop().then(resolve);
            } else {
                resolve();
            }
        });
    }
}

export const app = new App(new Boostrap());