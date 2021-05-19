import { Job, Queue, QueueOptions, WorkerOptions  } from "bullmq";

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
    protected abstract name: string;

    public concurrency = 1;

    public abstract handler(job: Job): any;

    public getQueueName(): string {
        return this.name;
    }

    public getOptions(): WorkerOptions {
        const options: WorkerOptions = {
            concurrency: this.concurrency,
        };

        return options;
    }
}

export class QueueEngineFacade {
    protected static instances: Map<string, Queue> = new Map();

    public static bootQueue(name: string, options?: QueueOptions): void {
        if (QueueEngineFacade.instances.has(name)) {
            throw new Error("Queue {{name}} already exists");
        }

        QueueEngineFacade.instances.set(name,  new Queue(name, options));
    }
    
    public static getInstance(name: string): Queue {
        if (!QueueEngineFacade.instances.has(name)) {
            QueueEngineFacade.instances.set(name, new Queue(name));
        }

        return QueueEngineFacade.instances.get(name) as Queue;
    }
}
