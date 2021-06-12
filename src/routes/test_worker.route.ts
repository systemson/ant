import { BaseRoute, Method } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";
import { QueueEngineFacade } from "../framework/queue";

export class TestWorkerRoute extends BaseRoute {
    url = "/test";

    method: Method = "get";

    handle(req: Request, res: Response): void {
        const job = "queue_test";

        const status = req.query.status;

        // Adds a job to the queue
        QueueEngineFacade.add(job, {name: status});

        res.send({
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{name}}] scheduled.", {
                name: job,
            })
        });
    } 
}
