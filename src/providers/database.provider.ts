import {
    DataSource,
} from "typeorm";
import path from "path";
import {
    CustomLogger,
    getConnectionConfig,
    getEnv,
    Lang,
    logCatchedException,
    Logger,
    logTypeORMCatchedError,
    OrmFacade,
    ServiceProvider,
    SnakeCaseNamingStrategy,
} from "@ant/framework";

export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            const dataSource = new DataSource(getConnectionConfig(getEnv("DB_TYPE", "postgres") as any, {
                entities: [path.join(__dirname, "..", "models/**/**.*")],
                migrations: [path.join(__dirname, "../", "database/migrations/**/**.*")],
                namingStrategy: new SnakeCaseNamingStrategy(),
                logger: getEnv("BD_DEBUG") === "true" ? new CustomLogger() : undefined,
            }));

            dataSource
                .initialize()
                .then((connection) => {
                    OrmFacade.orm = connection;
                    Logger.info(Lang.__("Connected to {{driver}} server on [{{host}}:{{port}}/{{database}}].", {
                        host: getEnv("DB_HOST", "localhost"),
                        port: getEnv("DB_PORT", "5432"),
                        driver: getEnv("DB_TYPE", "postgres"),
                        database: getEnv("DB_DATABASE", "ant"),
                    }));

                    resolve();
                }, error => {
                    logTypeORMCatchedError(error);
                    reject(error);
                })
                .catch((error) => {
                    Logger.error(Lang.__("Could not connect to {{driver}} server on [{{host}}:{{port}}/{{database}}].", {
                        host: getEnv("DB_HOST", "localhost"),
                        port: getEnv("DB_PORT", "5432"),
                        driver: getEnv("DB_TYPE", "postgres"),
                        database: getEnv("DB_DATABASE", "ant"),
                    }));

                    logCatchedException(error);
                });
        });
    }
}
