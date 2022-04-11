import {
    BaseWorker,
    Lang
} from "@ant/framework";
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

        throw new Error(Lang.__("Job [{{name}}#{{id}}] have failed.", {
            name: job.name,
            id: job.id?.toString() as string,
        }));
    }
}
