import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import { CacheFacade, RedisChacheDriver, RedisConfigContract } from "../framework/cache";

export default class CacheProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const redisConfig: RedisConfigContract = {
                port: parseInt(getEnv("REDIS_PORT", "6379")),
                host: getEnv("REDIS_HOST", "localhost"),
                password: getEnv("REDIS_PASSWORD"),
            };

            const driver = new RedisChacheDriver(redisConfig);

            CacheFacade.setDriver(driver);

            resolve();
        });
    }
}
