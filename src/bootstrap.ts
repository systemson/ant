import { ServiceProviderContract } from "./framework/service_provider";
import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
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

export class Boostrap {

    /**
     * The declared application's service providers.
     */
    public providers: (new() => ServiceProviderContract)[] = [
        LogProvider,
        DatabaseProvider,
        CacheProvider,
        RouterProvider,
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
}
