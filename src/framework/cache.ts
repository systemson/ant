import { Redis } from "ioredis";
import V8 from "v8";

export interface CacheDriverContract {
    set(key: string, value: any, ttl: number): Promise<void>;
    has(key: string): Promise<boolean>;
    get(key: string, def?: any): Promise<any>;
    unset(key: string): Promise<void>;
}

export class RedisChacheDriver implements CacheDriverContract {
    constructor(protected client: Redis) { }

    set(key: string, value: any, ttl: number): Promise<void> {
        return new Promise(async (resolve: CallableFunction) => {
            resolve(await this.client.set(key, value));
        })
    }

    has(key: string): Promise<boolean> {
        return new Promise(async (resolve: CallableFunction) => {
            resolve(await this.client.exists(key) > 0);
        });
    }

    get(key: string, def?: any): Promise<any> {
        return new Promise(async (resolve: CallableFunction) => {
            if (this.has(key)) {
                resolve(await this.client.get(key) as string);
            }

            return def;
        });
    }

    unset(key: string): Promise<void> {
        return new Promise(async (resolve: CallableFunction) => {
            resolve(await this.client.del(key));
        });
    }
}

export class CacheFacade {
    protected static driver: CacheDriverContract;

    public static setDriver(driver: CacheDriverContract): void {
        this.driver = driver;
    }

    public static set(key: string, value: any, ttl: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            return resolve(await this.driver.set(key, value, ttl));
        });
    }

    public static has(key: string): Promise<boolean> {
        return new Promise(async (resolve: CallableFunction) => {
            return resolve(await this.driver.has(key));
        });
    }

    public static get(key: string, def?: any): Promise<any> {
        return new Promise(async (resolve: CallableFunction) => {
            resolve(await this.driver.get(key));
        });
    }

    public static unset(key: string): Promise<void> {
        return new Promise(async (resolve: CallableFunction) => {
            resolve(await this.driver.unset(key));
        });
    }

    public static call(key: string, callback: CallableFunction, ttl: number): Promise<any> {
        return new Promise(async (resolve: CallableFunction) => {
            if (!this.driver.has(key)) {
                const value = callback();

                await this.driver.set(key, value, ttl);
            }

            resolve(await this.driver.get(key));
        })
    }
}
