import DatabaseProvider from "./providers/database.provider";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";
import LogProvider from "./providers/log.provider";
import CacheProvider from "./providers/cache.provider";
import { LogsListRoute } from "./routes/logs_list.route";
import RouterProvider from "./providers/router.provider";
import { TestWorkerRoute } from "./routes/test_worker.route";
import { TestWorker } from "./workers/test.worker";
import { JobsMonitorRoute } from "./routes/jobs_monitor.route";
import { BoostrapInterface, RouteContract, ServiceProviderContract, WorkerContract } from "@ant/framework";
import { TaskContract } from "@ant/framework/lib/src/scheduler";
import TasksProvider from "./providers/taks.provider";
import { TestTask } from "./tasks/test.task";

export class Boostrap implements BoostrapInterface {
    /**
     * The declared application's service providers.
     */
    public providers: (new(boostrap: BoostrapInterface) => ServiceProviderContract)[] = [
        LogProvider,
        CacheProvider,
        DatabaseProvider,
        RouterProvider,
        TasksProvider,
    ];

    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        LogsListRoute,
        TestWorkerRoute,
        JobsMonitorRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
        TestWorker
    ];

    /**
     * The declared application's tasks. 
     */
    tasks: (new () => TaskContract)[] = [
        TestTask
    ];
}
