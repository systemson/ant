import {
    ServiceProvider,
    getEnv,
    RedisConfigContract,
    RedisChacheDriver,
    CacheFacade,
    FilesystemChacheDriver
} from "@ant/framework";

export default class CacheProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            if (getEnv("APP_CACHE_DRIVER") === "redis") {
                this.initRedisCache();
            } else if (getEnv("APP_CACHE_DRIVER") === "file") {
                this.initFileCache();
            }
    
            resolve();
        });
    }

    protected initRedisCache(): void {
        const redisConfig: RedisConfigContract = {
            url: getEnv("REDIS_URL"),
            port: parseInt(getEnv("REDIS_PORT", "6379")),
            host: getEnv("REDIS_HOST", "localhost"),
            password: getEnv("REDIS_PASSWORD"),
        };

        const driver = new RedisChacheDriver(redisConfig);

        CacheFacade.setDriver(driver);
    }

    protected initFileCache(): void {
        const driver = new FilesystemChacheDriver(
            getEnv("APP_FILE_CACHE_DIR", "./storage/logs")
        );

        CacheFacade.setDriver(driver);
    }
}
