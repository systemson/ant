import { BaseRoute, Method, Request, Response } from "../framework/router";
import { Lang } from "../framework/lang";
import { QueueEngineFacade } from "../framework/queue";

export class TestWorkerRoute extends BaseRoute {
    url = "/test";

    method: Method = "get";

    async handle(req: Request, res: Response): Promise<Response> {
        const job = "queue_test/:status";

        const status = req.params.status;

        // Adds a job to the queue
        await QueueEngineFacade.add(job, {name: status});

        return res.setData({
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{name}}] scheduled.", {
                name: job,
            })
        });
    } 
}
