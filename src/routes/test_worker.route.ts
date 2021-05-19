import { BaseRoute } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";
import { QueueEngineFacade } from "../framework/queue";
import { getEnv } from "../framework/functions";

export class TestWorkerRoute extends BaseRoute {
    url = "/test";

    handle(req: Request, res: Response): Response {
        const job = "queue_test";

        const status = req.query.status;

        // Adds a job to the queue
        QueueEngineFacade.getInstance(getEnv("APP_QUEUE_NAME")).add(job, {name: status}, {
            removeOnComplete: true,
            attempts: 3,
        });

        return res.send({
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{name}}] scheduled.", {
                name: job,
            })
        });
    } 
}