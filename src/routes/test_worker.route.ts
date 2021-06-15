import { BaseRoute, Method } from "../framework/router";
import { Request } from "express";
import { Lang } from "../framework/lang";
import { QueueEngineFacade } from "../framework/queue";

export class TestWorkerRoute extends BaseRoute {
    url = "/test";

    method: Method = "get";

    async handle(req: Request): Promise<any> {
        const job = "queue_test";

        const status = req.query.status;

        // Adds a job to the queue
        await QueueEngineFacade.add(job, {name: status});

        return {
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{name}}] scheduled.", {
                name: job,
            })
        };
    } 
}
