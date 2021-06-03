import { Job, Queue, QueueOptions, WorkerOptions  } from "bullmq";
import { getEnv, logCatchedError } from "./functions";
import IORedis from 'ioredis';

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
}

export abstract class BaseWorker implements WorkerContract {
    protected name?: string;

    public concurrency = 1;

    public connection!: IORedis.Redis;

    public abstract handler(job: Job): any;

    public getQueueName(): string {
        return this.name || getEnv("APP_DEFAULT_QUEUE");;
    }

    protected getConnection(): IORedis.Redis {
        if (typeof this.connection === "undefined") {
            this.connection = new IORedis(
                parseInt(getEnv('REDIS_PORT', '6379')),
                getEnv('REDIS_HOST', 'localhost'),
                {
                    password: getEnv('REDIS_PASSWORD')
                }
            );

            this.connection.on("error", logCatchedError);
        }
        return this.connection;
    }

    public getOptions(): WorkerOptions {
        const options: WorkerOptions = {
            concurrency: this.concurrency,
            connection: this.getConnection()
        };

        return options;
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

    public static add(jobName: string, data: any): void {
        QueueEngineFacade.getInstance(this.default || getEnv("APP_DEFAULT_QUEUE")).add(jobName, data, {
            removeOnComplete: true,
            attempts: parseInt(getEnv("APP_QUEUE_RETRIES")),
            removeOnFail: getEnv("APP_QUEUE_REMOVE_FAILED") === "true",
        });
    }
}
