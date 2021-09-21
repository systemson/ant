import { ServiceProviderContract } from "./framework/service_provider";
import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";
import LogProvider from "./providers/log.provider";
import CacheProvider from "./providers/cache.provider";
import RouterProvider from "./providers/router.provider";
import { TasaBCVRoute } from "./routes/tasa_bcv.route";
import { TasaDolaTodayRoute } from "./routes/tasa_dolartoday.route";

export class Boostrap {

    /**
     * The declared application's service providers.
     */
    public providers: (new() => ServiceProviderContract)[] = [
        LogProvider,
        CacheProvider,
        RouterProvider,
    ];

    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        TasaBCVRoute,
        TasaDolaTodayRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
    ];
}
