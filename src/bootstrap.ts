import { ServiceProviderContract } from "./framework/service_provider";
import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
import DatabaseProvider from "./providers/database.provider";
import FileDirectoryProvider from "./providers/file_directory.provider";
import LocaleProvider from "./providers/locale.provider";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";
import LogProvider from "./providers/log.provider";
import CacheProvider from "./providers/cache.provider";
import { UserListRoute } from "./routes/users_list.route";
import RouterProvider from "./providers/router.provider";
import { TestWorkerRoute } from "./routes/test_worker.route";
import { TestWorker } from "./workers/test.worker";

export class Boostrap {

    /**
     * The declared application's service providers.
     */
    public providers: (new() => ServiceProviderContract)[] = [
        FileDirectoryProvider,
        LocaleProvider,
        LogProvider,
        CacheProvider,
        RouterProvider,
        DatabaseProvider
    ];

    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        UserListRoute,
        TestWorkerRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
        TestWorker
    ];
}
