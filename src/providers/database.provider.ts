import {
    createConnection,
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
            createConnection(getConnectionConfig(getEnv("DB_TYPE", "postgres") as any, {
                entities: [path.join(__dirname, "..", "models/**/**.*")],
                migrations: [path.join(__dirname, "../", "database/migrations/**/**.*")],
                synchronize: getEnv('DB_SYNCHRONIZE', 'false') == 'true',
                dropSchema: getEnv('DB_DROP_SCHEMA', 'false') == 'true',
                migrationsRun: getEnv('DB_MIGRATE', 'false') == 'true',
                namingStrategy: new SnakeCaseNamingStrategy(),
                logging: false,
                logger: getEnv("BD_DEBUG") === "true" ?  new CustomLogger() : undefined,
                ssl: getEnv('DB_SSL', 'false') == 'true',
                extra: {
                    ssl: getEnv('DB_SSL', 'false') == 'true' ? {
                        rejectUnauthorized: false,
                    } : undefined,
                },
            })).then((connection) => {
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
