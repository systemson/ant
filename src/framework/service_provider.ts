export interface ServiceProviderContract {
    boot(): void;
    init(): Promise<any>;
}

export abstract class ServiceProvider implements ServiceProviderContract {
    abstract boot(): void;

    public init(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                this.boot();
            } catch (error) {
                reject(error);
            }

            resolve({
                name: this.constructor.name,
            });
        });
    }
}