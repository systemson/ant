import { logCatchedException } from "./helpers";

export interface ServiceProviderContract {
    boot(): Promise<void>;
    init(): Promise<any>;
}

export abstract class ServiceProvider implements ServiceProviderContract {
    abstract boot(): Promise<void>;

    public init(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.boot()
                .then(() => resolve({
                    name: this.constructor.name
                }), reject)
                .catch(logCatchedException)
            ;
        });
    }
}
