import { ServiceProviderContract } from "./framework/service_provider";
import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
import DatabaseProvider from "./providers/database_provider";
import FileDirectoryProvider from "./providers/file_directory_provider";
import LocaleProvider from "./providers/locale_provider";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";
import LogProvider from "./providers/log_provider";
import CacheProvider from "./providers/cache_provider";
import { UserListRoute } from "./routes/users_list.route";

export class Boostrap {

    /**
     * The declared application's service providers.
     */
    public providers: (new() => ServiceProviderContract)[] = [
        FileDirectoryProvider,
        LocaleProvider,
        LogProvider,
        CacheProvider,
        DatabaseProvider
    ];

    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        UserListRoute,
        // TestWorkerRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
        // TestWorker
    ];
}
