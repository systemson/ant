import {
    BaseRoute,
    Method,
    Request,
    response,
    Response
} from "@ant/framework";
import { QueueEngineFacade } from "@ant/framework";
import { Lang } from "@ant/framework";

export class TestWorkerRoute extends BaseRoute {
    url = "/worker/test/:status";

    method: Method = "get";

    async handle(req: Request): Promise<Response> {
        const job = "queue_test";

        const status = req.params.status;

        if (!["completed", "failed"].includes(status)) {
            return response().error({
                status: Lang.__("failed"),
                messaje: Lang.__("Status [{{status}}] not supported. Statuses allowed: [completed, failed].", {
                    status: status,
                }),
            });
        }

        // Adds a job to the queue
        await QueueEngineFacade.add(job, {name: status});

        return response().json({
            status: Lang.__("ok"),
            messaje: Lang.__("Job [{{job}}] scheduled.", {
                job: job,
            }),
            result: status,
        });
    } 
}
