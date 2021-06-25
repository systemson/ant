import { Redis } from "ioredis";
import { logCatchedError } from "./helpers";

export interface CacheDriverContract {
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    has(key: string): Promise<boolean>;
    get(key: string, def?: unknown): Promise<any>;
    unset(key: string): Promise<void>;
}

export class RedisChacheDriver implements CacheDriverContract {
    constructor(protected client: Redis) { }

    set(key: string, value: unknown, ttl?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.set(key, value as any, "ex", ttl).then(() => resolve(), reject);
        });
    }

    has(key: string): Promise<boolean> {
        return new Promise((resolve: CallableFunction, reject: any) => {
            this.client.exists(key).then((value: number) => {
                resolve(value > 0);
            }, reject);
        });
    }

    get(key: string, def?: unknown): Promise<any> {
        return new Promise((resolve, reject) => {
            this.client.get(key).then((value: unknown) => {
                if (value) {
                    resolve(value);
                } else {
                    resolve(def);
                }
            }, reject);
        });
    }

    unset(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.del(key).then(() => {
                resolve();
            }, reject);
        });
    }
}

export class CacheFacade {
    protected static driver: CacheDriverContract;

    public static setDriver(driver: CacheDriverContract): void {
        this.driver = driver;
    }

    public static set(key: string, value: unknown, ttl?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.driver.set(key, value, ttl).then(resolve, reject).catch(logCatchedError);
        });
    }

    public static has(key: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.driver.has(key).then(resolve, reject).catch(logCatchedError);
        });
    }

    public static get(key: string, def?: unknown): Promise<any> {
        return new Promise((resolve, reject) => {
            this.driver.get(key, def).then(resolve, reject).catch(logCatchedError);
        });
    }

    public static unset(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.driver.unset(key).then(resolve, reject).catch(logCatchedError);
        });
    }

    public static call(key: string, callback: () => any, ttl?: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.driver.has(key).then((has: boolean) => {
                if (!has) {
                    const value = callback();
                    this.driver.set(key, value, ttl).then(() => {
                        this.driver.get(key).then(resolve, reject);
                    });
                }

                this.driver.get(key).then(resolve, reject);
            });
        });
    }
}
