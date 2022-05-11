import {
    getEnv,
    Lang,
    logCatchedError,
    logCatchedException,
    Logger,
    QueueEngineFacade,
    ServiceProvider,
    WorkerContract
} from "@ant/framework";
import { Job, QueueOptions, Worker } from "bullmq";

export default class WorkersProvider extends ServiceProvider {
    
    async boot(): Promise<void> {
        Logger.audit(Lang.__("Workers set up started."));
        await this.setWorkers(this.boostrap.workers)
            .then((count: number) => {
                Logger.audit(Lang.__("Workers set up completed [{{count}}].", {
                    count: count.toString()
                }));
            }, (error) => {
                Logger.audit(Lang.__(error.message));
            })
            .catch(logCatchedException)
        ;
    }

    public setWorkers(workerClasses: (new() => WorkerContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (workerClasses.length > 0) {

                for (const workerClass of workerClasses) {
                    for (let id = 0; id < parseInt(getEnv("APP_QUEUE_WORKERS_CONCURRENCY", "1")); id++) {
                        const instance = new workerClass();
                        instance.setId(id + 1);
                        instance.onCreated();

                        const queueName = instance.getQueueName();
            
                        Logger.audit(Lang.__("Preparing worker [{{name}}(#{{id}}):{{queue}}].", {
                            name: instance.constructor.name,
                            queue: queueName,
                            id: instance.getId().toString()
                        }));

                        const queueOptions = instance.getOptions() as QueueOptions;
                        
                        QueueEngineFacade.bootQueue(queueName, queueOptions);

                        const concrete = new Worker(
                            queueName,
                            (job: Job) => {
                                if (job.name) {
                                    Logger.debug(Lang.__(
                                        "Handling job [{{jobName}}(#{{jobId}})] on [{{name}}(#{{id}}):{{queue}}].",
                                        instance.getWorkerData(job)
                                    ));
    
                                    Logger.trace(JSON.stringify(job, null, 4));
    
                                    return instance.handler(job);
                                }
                            },
                            instance.getOptions()
                        );

                        instance.onBooted();

                        concrete.on("completed", (job: Job, returnValue: unknown) => {
                            instance.onCompleted(job, returnValue);
                        });

                        concrete.on("progress", (job: Job, progress: unknown) => {
                            instance.onProgress(job, progress);
                        });

                        concrete.on("failed", (job: Job, failedReason: Error) => {
                            instance.onFailed(job, failedReason);
                        });

                        concrete.on("drained", () => instance.onDrained());

                        concrete.on("error", error => {
                            if (error) {
                                instance.onError(error);
                                logCatchedError(error);
                            }
                        });

                        Logger.audit(Lang.__("Worker [{{name}}(#{{id}}):{{queue}}] is ready.", {
                            name: instance.constructor.name,
                            queue: queueName,
                            id: instance.getId().toString()
                        }));

                        if (getEnv("APP_QUEUE_REMOVE_FAILED_ON_START") === "true") {
                            QueueEngineFacade.getInstance(queueName).clean(5 * 60 * 1000, 0, "failed").then(() => {
                                resolve(workerClasses.length);
                            });
                        } else {
                            resolve(workerClasses.length);
                        }
                    }
                }

            } else {
                reject({
                    message: "No workers found.",
                });
            }
        });
    }
}
