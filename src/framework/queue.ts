import { Job, JobsOptions, Queue, QueueOptions, QueueScheduler, QueueSchedulerOptions, RepeatOptions, WorkerOptions  } from "bullmq";
import { dummyCallback, getEnv, Lang, logCatchedError, logCatchedException, sleep } from "./helpers";
import IORedis, { Redis } from "ioredis";
import { Logger } from "./logger";
import { snakeCase } from "typeorm/util/StringUtils";

/**
 * The Worker base interface
 */
export interface WorkerContract {
    /**
     * The worker's concurrency ID.
     */
    id: number;

    /**
     * Amount of jobs that a single worker is allowed to work on in parallel.
     */
    concurrency: number;

    /**
     * Sets the worker's concurrency ID.
     * 
     * @param id 
     */
    setId(id: number): void;

    /**
     * Gets the worker's concurrency ID.
     * 
     * @param id 
     */
    getId(): number;

    /**
     * Gets the queue name for the current worker.
     */
    getQueueName(): string;

    /**
     * The worker's configuration.
     */
    getOptions(): WorkerOptions;

    /**
     * Handles the job, and COULD return a response.
     * 
     * @param job The job to process
     */
    handler(job: Job): any;

    /**
     * Handles the failed job.
     * 
     * @param job The job to process
     * @param failedReason
     */
    handleFailed(job: Job, failedReason: string): void

    getWorkerData(job?: Job, data?: unknown, id?: number): {name: string; id: string, queue: string, jobName?: string, jobId?: string; data?: string};

    onCompleted(job: Job, returnValue: unknown): void;
    onProgress(job: Job, progress: number | unknown): void;
    onFailed(job: Job, failedReason: Error): void;
    onDrained(): void;
}

export abstract class BaseWorker implements WorkerContract {
    public id = 1;

    protected queueName!: string;

    public concurrency = parseInt(getEnv("APP_QUEUE_JOB_CONCURRENCY", "1"));

    public connection!: Redis;

    public abstract handler(job: Job): any;

    public setId(id: number): void {
        this.id = id;
    }

    public getId(): number {
        return this.id;
    }

    public getQueueName(): string {
        return this.queueName || snakeCase(getEnv("APP_DEFAULT_QUEUE", "default"));
    }

    protected getConnection(): Redis {
        if (typeof this.connection === "undefined") {

            const config = {
                port: parseInt(getEnv("REDIS_PORT", "6379")),
                host: getEnv("REDIS_HOST", "localhost"),
                password: getEnv("REDIS_PASSWORD"),

            };
            const redis = new IORedis(
                config.port,
                config.host,
                {
                    password: config.password
                }
            );

            this.connection = redis;

            this.connection.on("error", (error) => {
                Logger.error(Lang.__("Could not connect to redis server on [{{host}}:{{port}}].", {
                    host: config.host,
                    port: config.port.toString(),
                }));

                logCatchedException(error);
            });
        }
        return this.connection;
    }

    public getOptions(): WorkerOptions {
        const options: WorkerOptions = {
            concurrency: this.concurrency,
            connection: this.getConnection(),
            prefix: snakeCase(getEnv("APP_QUEUE_GROUP", "ant")),
        };

        return options;
    }

    protected dispatch(queueName: string, queuejob: string, data: unknown): Promise<unknown> {
        return QueueEngineFacade.queue(queueName).add(queuejob, data);
    }

    public handleFailed(job: Job, failedReason: string): void {
        dummyCallback(job, failedReason);
    }

    public onCompleted(job: Job, returnValue: unknown): void {
        Logger.debug(Lang.__("Job [{{job}}#{{id}}] successfully completed on [{{name}}(#{{id}}):{{queue}}]. Returning: {{{data}}}.",
            this.getWorkerData(
                job,
                returnValue
            )
        ));
        Logger.trace(JSON.stringify(job, null, 4));
    }

    public onProgress(job: Job<any, any, string>, progress: unknown): void {
        Logger.debug(JSON.stringify(job, null, 4));
        Logger.trace(JSON.stringify(progress));
    }

    public onFailed(job: Job, failedReason: Error): void {
        Logger.error(Lang.__("Job [{{job}}#{{id}}] failed on [{{name}}(#{{id}}):{{queue}}].",
            this.getWorkerData(
                job
            )
        ));

        logCatchedError(failedReason);
        
        Logger.trace(JSON.stringify(job, null, 4));
        
        this.handleFailed(job, failedReason.message);
    }

    public onDrained(): void {
        Logger.audit(Lang.__("Queue [{{name}}(#{{id}}):{{queue}}] is empty.", this.getWorkerData()));
    }
    
    public getWorkerData(job?: Job, data?: unknown): {name: string; id: string; queue: string, jobName?: string, jobId?: string; data?: string} {
        return {
            name: this.constructor.name,
            id: this.getId().toString(),
            queue: this.getQueueName(),
            jobName: job?.name,
            jobId: job?.id?.toString() as string,
            data: JSON.stringify(data),
        };
    }
}

export class QueueEngineFacade {
    protected static instances: Map<string, Queue> = new Map();
    protected static schedulers: Map<string, QueueScheduler> = new Map();
    protected static default: string;

    public static bootQueue(name: string, queueOptions?: QueueOptions): typeof QueueEngineFacade {
        if (!QueueEngineFacade.instances.has(name)) {
            queueOptions = queueOptions || this.fallbackQueueOptions();

            const queue = new Queue(name, queueOptions);

            QueueEngineFacade.instances.set(name, queue);

            if (getEnv("APP_QUEUE_RETRY_STRATEGY", "none") !== "none") {
                const queueSchedulerOptions = queueOptions as QueueSchedulerOptions;
                queueSchedulerOptions["maxStalledCount"] = 10;
                queueSchedulerOptions["stalledInterval"] = 1000;

                const Scheduler = new QueueScheduler(name, queueSchedulerOptions);
                QueueEngineFacade.schedulers.set(name, Scheduler);
            }
        }

        return QueueEngineFacade;
    }
    
    public static getInstance(name: string): Queue {
        this.bootQueue(name);

        return QueueEngineFacade.instances.get(name) as Queue;
    }

    public static queue(name: string): typeof QueueEngineFacade {
        this.bootQueue(name);

        this.default = name;

        return QueueEngineFacade;
    }

    public static add(jobName: string, data: unknown): Promise<unknown> {
        return this.dispatch(jobName, data);
    }

    public static dispatch(jobName: string, data: unknown, jobOptions?: JobsOptions): Promise<unknown> {
        Logger.debug(Lang.__("Dispatching Job [{{job}}] to queue [{{queue}}].", {
            job: jobName,
            queue: this.default || snakeCase(getEnv("APP_DEFAULT_QUEUE"))
        }));
        Logger.trace("Job data: " + JSON.stringify(data, null, 4));

        return QueueEngineFacade.getInstance(
            this.default || snakeCase(getEnv("APP_DEFAULT_QUEUE"))
        ).add(
            jobName,
            data,
            this.jobOptions(jobOptions)
        );
    }

    public static repeat(jobName: string, data: unknown, options: RepeatOptions): Promise<unknown>  {
        return this.dispatch(jobName, data, this.jobOptions(options));
    }

    private static jobOptions(options?: JobsOptions): JobsOptions {
        let backoff;
        if (getEnv("APP_QUEUE_RETRY_STRATEGY", "none") !== "none") {
            backoff = {
                type: getEnv("APP_QUEUE_RETRY_STRATEGY", "fixed"),
                delay: parseInt(getEnv("APP_QUEUE_RETRY_DELAY", "1000")),
            };
        }

        const baseOptions: JobsOptions = {
            removeOnComplete: getEnv("APP_QUEUE_REMOVE_COMPLETED") === "true",
            attempts: parseInt(getEnv("APP_QUEUE_RETRIES", "3")),
            removeOnFail: getEnv("APP_QUEUE_REMOVE_FAILED") === "true",
            backoff: backoff,
        };

        return Object.assign(baseOptions, options);
    }

    private static fallbackQueueOptions(): QueueOptions {
        const config = {
            port: parseInt(getEnv("REDIS_PORT", "6379")),
            host: getEnv("REDIS_HOST", "localhost"),
            password: getEnv("REDIS_PASSWORD"),
        };

        const redis = new IORedis(config.port, config.host, {
            password: config.password
        });

        redis.on("error", (error) => {
            Logger.error(Lang.__("Could not connect to redis server on [{{host}}:{{port}}].", {
                host: config.host,
                port: config.port.toString(),
            }));

            logCatchedException(error);
        });

        return {
            connection: redis,
            prefix: snakeCase(getEnv("APP_QUEUE_GROUP", "ant")),
        };
    }

    public static stop(): Promise<void> {
        return new Promise<void>((resolve) => {
            for (const instance of this.instances.values()) {
                Logger.audit(Lang.__("Stoping queue [{{queue}}].", {
                    queue: instance.name,
                })).then(async () => {
                    await instance.pause().then(async () => {
                        while (await instance.getActiveCount() > 0) {
                            await sleep(100);
                        }
                        resolve();
                    });
                });
            
            }
        });
    }
}

