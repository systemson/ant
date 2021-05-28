import { Boostrap } from "../bootstrap";
import { Lang } from "../framework/lang";
import { Logger } from "./logger";
import { QueueEngineFacade, WorkerContract } from "./queue";
import { RouteContract, RouteOptions, RouterConfig } from "./router";
import { Job, Worker } from "bullmq";
import { Express } from "express";

export class App {
    routes: Map<string, RouteOptions> = new Map();

    constructor(
        protected router: Express,
        protected config: RouterConfig,
    ) {
        const boostrap = new Boostrap();
        this.init();
        boostrap.boot();
        this.setRoutes(boostrap.routes);
        this.setWorkers(boostrap.workers);
    }

    protected startHttpServer(): void {
        this.router.listen(this.config.port, () => {
            Logger.info(Lang.__("Http server is running at [{{scheme}}://{{host}}:{{port}}]", {
                scheme: this.config.scheme || "http",
                host: this.config.host || "localhost",
                port: this.config.port,
            }));
        });
    }

    public setRoutes(routeClasses:  (new() => RouteContract)[]): void {
        for (const routeClass of routeClasses) {
            const instance = new routeClass() as RouteContract;

            this.router[instance.method](instance.url, instance.handle);

            Logger.trace(Lang.__("Route [{{scheme}}://{{host}}:{{port}}{{{name}}}] is ready.", {
                scheme: this.config.scheme || "http",
                host: this.config.host || "localhost",
                port: this.config.port,
                name: instance.url,
            }));
        }
    }

    public setWorkers(workerClasses: (new() => WorkerContract)[]): void {
        for (const workerClass of workerClasses) {
            const instance = new workerClass();

            const queueName = instance.getQueueName();

            QueueEngineFacade.bootQueue(queueName);

            const concrete = new Worker(queueName, instance.handler, instance.getOptions());

            concrete.on("completed", (job: Job, returnValue: any) => {
                Logger.debug(Lang.__("Job [{{name}}#{{id}}] successfully completed. Returning: {{{return}}}", {
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
                Logger.error(Lang.__("Job [{{name}}#{{id}}] failed. {{reason}}", {
                    name: job.name,
                    id: job.id?.toString() as string,
                    reason: failedReason,
                }));

                Logger.trace(JSON.stringify(job, null, 4));
            });

            concrete.on("drained", () => {
                Logger.extra("Queue is empty");
            });
        }
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
    public boot(): void {
        this.startHttpServer();
    }
}
