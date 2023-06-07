import {
    ServiceProvider,
    getEnv,
    RedisConfigContract,
    RedisChacheDriver,
    CacheFacade,
    FilesystemChacheDriver,
    Lang,
    Logger
} from "@ant/framework";

export default class CacheProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            let result: Promise<void>;
            const driver = getEnv("APP_CACHE_DRIVER");

            if (driver == "redis") {
                result = this.initRedisCache();
            } else if (driver == "file") {
                result = this.initFileCache();
            } else {
                throw new Error(Lang.__("Driver [{{driver}}] is invalid.", {
                    driver: driver,
                }));
            }

            Logger.audit(Lang.__("Preparing [{{driver}}] cache driver.", {
                driver: driver,
            }));

            result.then(resolve, reject).catch(reject);
            
            Logger.audit(Lang.__("Cache driver [{{driver}}] is ready.", {
                driver: driver,
            }));
        });
    }

    protected initRedisCache(): Promise<void> {
        const redisConfig: RedisConfigContract = {
            url: getEnv("REDIS_URL"),
            port: parseInt(getEnv("REDIS_PORT", "6379")),
            host: getEnv("REDIS_HOST", "localhost"),
            password: getEnv("REDIS_PASSWORD"),
            username: getEnv("REDIS_USERNAME"),
        };

        const driver = new RedisChacheDriver(redisConfig);

        return CacheFacade.setDriver(driver);
    }

    protected initFileCache(): Promise<void> {
        const driver = new FilesystemChacheDriver(
            getEnv("APP_FILE_CACHE_DIR", "./storage/logs")
        );

        return CacheFacade.setDriver(driver);
    }
}
