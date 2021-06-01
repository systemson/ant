import { Boostrap } from "../bootstrap";
import { Lang } from "../framework/lang";
import { Logger } from "./logger";
import { QueueEngineFacade, WorkerContract } from "./queue";
import { RouteContract, RouteOptions, RouterConfig } from "./router";
import { Job, Worker } from "bullmq";
import { Express } from "express";
import { getEnv } from "./functions";

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
        return new Promise(() => {
            for (const routeClass of routeClasses) {
                const instance = new routeClass() as RouteContract;
    
                this.router[instance.method](instance.url, instance.handle);
    
                Logger.audit(Lang.__("Route [{{scheme}}://{{host}}:{{port}}{{{name}}}] is ready.", {
                    scheme: this.config.scheme || "http",
                    host: this.config.host || "localhost",
                    port: this.config.port,
                    name: instance.url,
                }));
            }

            Logger.audit(Lang.__("All routes ready."));
        });
    }

    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<void> {
        return new Promise(() => {
            for (const workerClass of workerClasses) {
                const instance = new workerClass();

                const queueName = instance.getQueueName();

                QueueEngineFacade.bootQueue(queueName);

                const concrete = new Worker(queueName, (job: Job) => instance.handler(job), instance.getOptions());

                concrete.on("completed", (job: Job, returnValue: any) => {
                    Logger.debug(Lang.__("Job [{{name}}#{{id}}] successfully completed. Returning: {{{return}}}.", {
                        name: job.name,
                        id: job.id?.toString() as string,
                        return: JSON.stringify(returnValue, null, 4),
                    }));
                    Logger.trace(JSON.stringify(job, null, 4));
                });

                concrete.on("progress", (job: Job, progress: number | unknown) => {
                    Logger.debug(JSON.stringify(job));
                    Logger.trace(JSON.stringify(progress));
                });

                concrete.on("failed", (job: Job, failedReason: string) => {
                    Logger.error(Lang.__("Job [{{name}}#{{id}}] failed. {{reason}}.", {
                        name: job.name,
                        id: job.id?.toString() as string,
                        reason: failedReason,
                    }));

                    Logger.trace(JSON.stringify(job, null, 4));
                });

                concrete.on("drained", () => {
                    Logger.audit(Lang.__("Queue [{{name}}] is empty.", {
                        name: queueName,
                    }));
                });
            }

            Logger.audit(Lang.__("All workers ready."));
        });
    }

    protected bootProviders(): Promise<void> {
        return new Promise(() => {
            for (const providerClass of this.boostrap.providers) {
                (new providerClass()).boot();
            }
        });
    }
    

    /**
     * Prepares the application.
     */
    public init(): void {
        //
    }
    

    /**
     * Sets ready the application.
     */
    public boot(): Promise<void> {
        return new Promise((resolve, rejects) => {
            try {
                this.bootProviders();
                Logger.info(Lang.__("Starting [{{name}}] microservice", { name: getEnv("APP_NAME") }));
        
                this.setRoutes(this.boostrap.routes);
                this.setWorkers(this.boostrap.workers);
                this.startHttpServer();
                
            } catch (error) {
                rejects();
            }
            resolve();
        });
    }
}
