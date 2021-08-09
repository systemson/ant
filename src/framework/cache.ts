import IORedis, { Redis } from "ioredis";
import { getEnv, logCatchedError, logCatchedException, now } from "./helpers";
import { Lang } from "./lang";
import { Logger } from "./logger";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface CacheDriverContract {
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    has(key: string): Promise<boolean>;
    get(key: string, def?: unknown): Promise<any>;
    unset(key: string): Promise<void>;
}

export class FilesystemChacheDriver implements CacheDriverContract {
    public constructor(
        public baseDir: string
    ) {
        this.initFilesystem();
    }

    private initFilesystem() {
        if (!fs.existsSync(this.baseDir)){
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }

    set(key: string, value: unknown, ttl?: number): Promise<void> {
        return new Promise((resolve) => {
            resolve(
                fs.writeFileSync(
                    this.getRealKey(key),
                    this.encode({
                        data: value,
                        until: parseInt(now().format("x")) + (ttl || 0),
                    })
                )
            );
        });
    }

    has(key: string): Promise<boolean> {
        return new Promise((resolve) => {
            if (fs.existsSync(this.getRealKey(key))) {
                const token = this.decode(this.getFileData(key)) as any;
                if (token.until && token.until >= parseInt(now().format("x"))) {
                    resolve(true);
                } else {
                    this.unset(key).then(() => resolve(false));
                }
            } else {
                resolve(false);
            }

        });
    }

    get(key: string, def?: unknown): Promise<any> {
        return new Promise((resolve) => {
            resolve((this.decode(this.getFileData(key)) as any)?.data || def);
        });
    }

    unset(key: string): Promise<void> {
        return new Promise((resolve) => {
            const path = this.getRealKey(key);
            if (fs.existsSync(path)) {
                fs.unlinkSync(path);
            }

            resolve();
        });
    }

    protected getRealKey(key: string): string {
        return path.join(this.baseDir, crypto.createHash("sha256").update(key).digest("hex"));
    }

    protected getFileData(key: string): string {
        try {
            return fs.readFileSync(this.getRealKey(key)).toString("utf-8");
        } catch (error) {
            return JSON.stringify("");
        }
    }

    protected encode(data: unknown): string {
        return JSON.stringify(data);
    }

    protected decode(data: string): unknown {
        return JSON.parse(data);
    }
}


export type RedisConfigContract = {
    url?: string;
    port: number;
    host: string;
    password: string;
}

export class RedisChacheDriver implements CacheDriverContract {
    private client!: Redis;

    constructor(protected config: RedisConfigContract) { }

    private initRedis() {
        if (this.client === undefined) {
            if (this.config.url) {
                this.client = new IORedis(this.config.url);
            } else {
                this.client = new IORedis(this.config.port, this.config.host, {
                    password: this.config.password
                });
            }

            this.client.on("error", (error) => {
                Logger.error(Lang.__("Could not connect to redis server on [{{host}}:{{port}}].", {
                    host: this.config.host,
                    port: this.config.port.toString(),
                }));

                logCatchedException(error);
            });
        }
    }

    set(key: string, value: unknown, ttl?: number): Promise<void> {
        this.initRedis();
        return new Promise((resolve, reject) => {
            this.client.set(this.getRealKey(key), JSON.stringify(value), "px", ttl?.toString()).then(() => resolve(), reject);
        });
    }

    has(key: string): Promise<boolean> {
        this.initRedis();
        return new Promise((resolve: CallableFunction, reject: any) => {
            this.client.exists(this.getRealKey(key)).then((value: number) => {
                resolve(value > 0);
            }, reject);
        });
    }

    get(key: string, def?: unknown): Promise<any> {
        this.initRedis();
        return new Promise((resolve, reject) => {
            this.client.get(this.getRealKey(key)).then((value) => {
                if (value) {
                    resolve(JSON.parse(value));
                } else {
                    resolve(def);
                }
            }, reject);
        });
    }

    unset(key: string): Promise<void> {
        this.initRedis();
        return new Promise((resolve, reject) => {
            this.client.del(this.getRealKey(key)).then(() => {
                resolve();
            }, reject);
        });
    }

    protected getRealKey(key: string): string {
        return `${getEnv("APP_REDIS_CACHE_PREFIX")}${key}`;
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

    public static call(key: string, callback: Promise<any>, ttl?: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.driver.has(key).then((has: boolean) => {
                if (!has) {
                    callback.then(value => {
                        this.driver.set(key, value, ttl).then(() => {
                            this.driver.get(key).then(resolve, reject);
                        });
                    });
                } else {
                    this.driver.get(key).then(resolve, reject);
                }
            });
        });
    }
}
