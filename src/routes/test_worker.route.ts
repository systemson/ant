import { BaseRoute } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";
import { QueueEngineFacade } from "../framework/queue";

export class TestWorkerRoute extends BaseRoute {
    url = "/test";

    handle(req: Request, res: Response): Response {
        const job = "queue_test";

        const status = req.query.status;

        // Adds a job to the queue
        QueueEngineFacade.add(job, {name: status});

        return res.send({
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{name}}] scheduled.", {
                name: job,
            })
        });
    } 
}