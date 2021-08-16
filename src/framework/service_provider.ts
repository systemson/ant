export interface ServiceProviderContract {
    boot(): Promise<void>;
}

export abstract class ServiceProvider implements ServiceProviderContract {
    abstract boot(): Promise<void>;
}
