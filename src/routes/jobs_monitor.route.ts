import { Queue } from "bullmq";
import { getEnv } from "../framework/helpers";
import { QueueEngineFacade } from "../framework/queue";
import { BaseRoute, Method, Request, response, Response } from "../framework/router";

export class JobsMonitorRoute extends BaseRoute {
    url = "/api/jobs_monitor";

    method: Method = "get";

    async handle(req: Request): Promise<Response> {
        const queueName = req.query.queue as string;
        const statusName = req.query.status as string;

        let queue: Queue;
        let statuses: string[];

        if (statusName) {
            statuses = [statusName];
        } else {
            statuses = [
                "completed",
                "failed",
                "delayed",
                "repeat",
                "waiting-children",
                "active",
                "wait",
                "paused",
            ];
        }

        if (queueName) {
            queue = QueueEngineFacade.getInstance(queueName);
        } else {
            
            queue = QueueEngineFacade.getInstance(getEnv("APP_DEFAULT_QUEUE"));
        }

        const result: any = {};

        for (const status of statuses) {
            result[status] = {
                jobs: await queue.getJobs(status),
                total: await queue.getJobCountByTypes(status),
            };
        }

        return response(result);
    } 
}
/*
case 'completed':
case 'failed':
case 'delayed':
case 'repeat':
case 'waiting-children':
    return callback(key, count ? 'zcard' : 'zrange');
case 'active':
case 'wait':
case 'paused':
    */