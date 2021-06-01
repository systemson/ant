import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
import DatabaseProvider from "./providers/database_provider";
import FileDirectoryProvider from "./providers/file_directory_provider";
import LocaleProvider from "./providers/locale_provider";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";

export interface ServiceProviderContract {
    boot(): Promise<any>;
}

export class Boostrap {

    /**
     * The declared application's service providers.
     */
    public providers: (new() => ServiceProviderContract)[] = [
        FileDirectoryProvider,
        LocaleProvider,
        DatabaseProvider
    ];

    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        //TestWorkerRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
        // TestWorker
    ];
}
