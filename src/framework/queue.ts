import { Job, Queue, QueueOptions, WorkerOptions  } from "bullmq";
import { dummyCallback, getEnv } from "./helpers";
import IORedis, { Redis } from "ioredis";

/**
 * The Worker base interface
 */
export interface WorkerContract {
    /**
     * Amount of jobs that a single worker is allowed to work on in parallel.
     */
    concurrency: number;

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
}

export abstract class BaseWorker implements WorkerContract {
    protected queueName!: string;

    public concurrency = parseInt(getEnv("APP_QUEUE_CONCURRENCY", "1"));

    public connection!: Redis;

    public abstract handler(job: Job): any;

    public getQueueName(): string {
        return this.queueName || getEnv("APP_DEFAULT_QUEUE", "default");
    }

    protected getConnection(): Redis {
        if (typeof this.connection === "undefined") {
            const redis = new IORedis(
                parseInt(getEnv("REDIS_PORT", "6379")),
                getEnv("REDIS_HOST", "localhost"),
                {
                    password: getEnv("REDIS_PASSWORD")
                }
            );

            this.connection = redis;
        }
        return this.connection;
    }

    public getOptions(): WorkerOptions {
        const options: WorkerOptions = {
            concurrency: this.concurrency,
            connection: this.getConnection(),
        };

        return options;
    }

    protected dispatch(queueName: string, queuejob: string, data: unknown): Promise<unknown> {
        return QueueEngineFacade.queue(queueName).add(queuejob, data);
    }

    public handleFailed(job: Job, failedReason: string): void {
        dummyCallback(job, failedReason);
    }
}

export class QueueEngineFacade {
    protected static instances: Map<string, Queue> = new Map();
    protected static default: string;

    public static bootQueue(name: string, options?: QueueOptions): typeof QueueEngineFacade {
        if (!QueueEngineFacade.instances.has(name)) {
            QueueEngineFacade.instances.set(name,  new Queue(name, options));
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
        return QueueEngineFacade.getInstance(this.default || getEnv("APP_DEFAULT_QUEUE")).add(jobName, data, {
            removeOnComplete: true,
            attempts: parseInt(getEnv("APP_QUEUE_RETRIES", "3")),
            removeOnFail: getEnv("APP_QUEUE_REMOVE_FAILED") === "true",
        });
    }
}
