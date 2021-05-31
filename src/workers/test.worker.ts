import { BaseWorker } from "../framework/queue";
import { Lang } from "../framework/lang";
import { Job } from "bullmq";

export class TestWorker extends BaseWorker {
    handler(job: Job): any {
        if (job.data.name === "completed") {
            return {
                status: "ok",
                message: Lang.__("Job [{{name}}#{{id}}] completed", {
                    name: job.name,
                    id: job.id?.toString() as string,
                })
            };
        }

        throw new Error(Lang.__("Job have failed."));
    }
}
