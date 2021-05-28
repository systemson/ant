import { WorkerContract } from "./framework/queue";
import { RouteContract } from "./framework/router";
import { HomeRoute } from "./routes/home.route";
import { InfoRoute } from "./routes/info.route";
import { TestWorkerRoute } from "./routes/test_worker.route";
import SockerServer from "./socket_server";
import { TestWorker } from "./workers/test.worker";

export interface ServiceProviderContract {
    boot(): void;
}

export class Boostrap {
    /**
     * The declared application's routes. 
     */
    public routes:  (new() => RouteContract)[] = [
        HomeRoute,
        InfoRoute,
        TestWorkerRoute,
    ];

    /**
     * The declared application's workers. 
     */
    public workers: (new() => WorkerContract)[] = [
        TestWorker,
    ];

    public providers: (new() => ServiceProviderContract)[] = [
        //
    ];
}
