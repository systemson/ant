import { ServiceProvider } from "../framework/service_provider";
import { getEnv } from "../framework/helpers";
import IORedis from "ioredis";
import { CacheFacade, RedisChacheDriver } from "../framework/cache";

export default class CacheProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise(() => {
            const redisClient = new IORedis(
                parseInt(getEnv("REDIS_PORT", "6379")),
                getEnv("REDIS_HOST", "localhost"),
                {
                    password: getEnv("REDIS_PASSWORD")
                }
            );

            const driver = new RedisChacheDriver(redisClient);

            CacheFacade.setDriver(driver);
        });
    }
}
