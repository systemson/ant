/* eslint-disable indent */
import {
    createConnection,
    ConnectionOptions,
    DatabaseType
} from "typeorm";
import {
    DefaultNamingStrategy,
    NamingStrategyInterface
} from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";
import path from "path";
import { Logger as TypeOrmLogContract, Table } from "typeorm";
import {
    ConsoleLogger,
    getEnv,
    Lang,
    logCatchedException,
    Logger,
    OrmFacade,
    ServiceProvider,
    timestamp
} from "@ant/framework";

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    tableName(className: string, customName: string): string {
        return (customName ? customName : snakeCase(className)).toUpperCase();
    }

    columnName(
        propertyName: string,
        customName: string
    ): string {
        return (
            customName ? customName : snakeCase(propertyName)
        ).toUpperCase();
    }

    relationName(propertyName: string): string {
        return snakeCase(propertyName);
    }

    joinColumnName(relationName: string, referencedColumnName: string): string {
        return snakeCase(relationName + "_" + referencedColumnName);
    }

    joinTableName(
        firstTableName: string,
        secondTableName: string,
        firstPropertyName: string,
    ): string {
        return snakeCase(
            firstTableName +
            "_" +
            firstPropertyName.replace(/\./gi, "_") +
            "_" +
            secondTableName,
        );
    }

    joinTableColumnName(
        tableName: string,
        propertyName: string,
        columnName?: string,
    ): string {
        return snakeCase(
            tableName + "_" + (columnName ? columnName : propertyName),
        );
    }

    joinTableInverseColumnName(
        tableName: string,
        propertyName: string,
        columnName?: string,
    ): string {
        return snakeCase(
            tableName + "_" + (columnName ? columnName : propertyName),
        );
    }

    primaryKeyName(tableOrName: Table | string, columnNames: string[]): string {
        return `pk_${typeof tableOrName == 'string' ? tableOrName : tableOrName.name}_${columnNames.join("_")}`;
    }

    foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
        return `fk_${typeof tableOrName == 'string' ? tableOrName : tableOrName.name}_${columnNames.join("_")}`;
    }

    indexName(tableOrName: Table | string, columnNames: string[]): string{
        return `in_${typeof tableOrName == 'string' ? tableOrName : tableOrName.name}_${columnNames.join("_")}`;
    }

    uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
        return `uq_${typeof tableOrName == 'string' ? tableOrName : tableOrName.name}_${columnNames.join("_")}`;
    }

    classTableInheritanceParentColumnName(
        parentTableName: unknown,
        parentTableIdPropertyName: unknown,
    ): string {
        return snakeCase(parentTableName + "_" + parentTableIdPropertyName);
    }

    eagerJoinRelationAlias(alias: string, propertyPath: string): string {
        return alias + "__" + propertyPath.replace(".", "_");
    }
}

export class CustomLogger implements TypeOrmLogContract {
    protected logger = new ConsoleLogger();
    protected timestamp = timestamp;

    logQuery(query: string, parameters?: any[]): void {
        const date = this.timestamp();
        this.logger.log(query, "audit", date);
        this.logger.log(JSON.stringify(parameters), "audit", date);
    }
    logQueryError(error: string | Error, query: string, parameters?: any[]): void {
        const date = this.timestamp();
        this.logger.log(JSON.stringify(error), "audit", date);
        this.logger.log(query, "audit", date);
        this.logger.log(JSON.stringify(parameters), "audit", date);
    }
    logQuerySlow(time: number, query: string, parameters?: any[]): void {
        const date = this.timestamp();
        this.logger.log(time.toString(), "audit", date);
        this.logger.log(query, "audit", date);
        this.logger.log(JSON.stringify(parameters), "audit", date);
    }
    logSchemaBuild(message: string): void {
        const date = this.timestamp();
        this.logger.log(message, "audit", date);
    }
    logMigration(message: string): void {
        const date = this.timestamp();
        this.logger.log(message, "audit", date);
    }
    log(level: "warn" | "info" | "log", message: string): void {
        const date = this.timestamp();
        this.logger.log(message, "audit", date);
    }
}

// eslint-disable-next-line no-undef
export function getConnectionConfig(
    type: Exclude<DatabaseType, "aurora-data-api" | "aurora-data-api-pg" | "expo" | "capacitor">,
    extra?: Partial<ConnectionOptions>
): Exclude<ConnectionOptions, "CapacitorConnectionOptions"> {
    let config: Exclude<ConnectionOptions, "CapacitorConnectionOptions">;

    switch (type) {
        case "oracle":
            config = {
                type: type,
                url: getEnv("DB_URL"),
                host: getEnv("DB_HOST", "localhost"),
                port: parseInt(getEnv("DB_PORT", "5432")),
                username: getEnv("DB_USERNAME", "postgres"),
                password: getEnv("DB_PASSWORD", "postgres"),
                sid: getEnv("DB_DATABASE"),
                schema:  getEnv("DB_SCHEMA", ""),
                entityPrefix: getEnv("BD_PREFIX"),
            }
            break;

            case "postgres":
            case "mysql":
            case "mariadb":
            case "cockroachdb":
                config = {
                    type: type,
                    url: getEnv("DB_URL"),
                    host: getEnv("DB_HOST", "localhost"),
                    port: parseInt(getEnv("DB_PORT", "5432")),
                    username: getEnv("DB_USERNAME", "postgres"),
                    password: getEnv("DB_PASSWORD", "postgres"),
                    database: getEnv("DB_DATABASE"),
                    schema:  getEnv("DB_SCHEMA", ""),
                    entityPrefix: getEnv("BD_PREFIX"),
                }
                break;

            case "sqlite":
            case "better-sqlite3":
                config = {
                    type: "sqlite",
                    database: getEnv("DB_DATABASE"),
                    entityPrefix: getEnv("BD_PREFIX"),
                }
                break;

        default:
            throw new Error(Lang.__("No default connection availible for [{{type}}]", {
                type: type
            }));
            break;
    }
    return Object.assign({}, config, extra);
}

export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            createConnection(getConnectionConfig(getEnv("DB_TYPE", "postgres") as any, {
                entities: [path.join(__dirname, "..", "models/**/**.*")],
                synchronize: false,
                dropSchema: false,
                namingStrategy: new SnakeCaseNamingStrategy(),
                logging: false,
                logger: getEnv("BD_DEBUG") === "true" ?  new CustomLogger() : undefined,
            })).then((connection) => {
                OrmFacade.orm = connection;
                Logger.info(Lang.__("Connected to {{driver}} server on [{{host}}:{{port}}/{{database}}].", {
                    host: getEnv("DB_HOST", "localhost"),
                    port: getEnv("DB_PORT", "5432"),
                    driver: getEnv("DB_TYPE", "postgres"),
                    database: getEnv("DB_DATABASE", "ant"),
                }));
                resolve();
            }, reject)
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
