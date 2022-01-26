import { createConnection } from "typeorm";
import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";
import path from "path";
import { cwd } from "process";
import {Logger as TypeOrmLogContract} from "typeorm";
import { ConsoleLogger, getEnv, Lang, logCatchedException, Logger, NODE_ENV, OrmFacade, ServiceProvider, timestamp } from "@ant/framework";

export class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    tableName(className: string, customName: string): string {
        return customName ? customName : snakeCase(className);
    }

    columnName(
        propertyName: string,
        customName: string
    ): string {
        return (
            customName ? customName : snakeCase(propertyName)
        );
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

export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            createConnection({
                type: getEnv("DB_TYPE", "postgres") as any,
                host: getEnv("DB_HOST", "localhost"),
                port: parseInt(getEnv("DB_PORT", "5432")),
                username: getEnv("DB_USERNAME", "postgres"),
                password: getEnv("DB_PASSWORD", "postgres"),
                database: getEnv("DB_DATABASE"),
                schema:  getEnv("DB_SCHEMA", "public"),
                entities: NODE_ENV === "compiled" ? [path.join(__dirname, "/../../", "src", "models/**/*.js")] : [path.join(cwd(), "src", "models/**/*.ts")],
                entityPrefix: getEnv("BD_PREFIX"),
                synchronize: false,
                dropSchema: false,
                namingStrategy: new SnakeCaseNamingStrategy(),
                logging: false,
                logger: getEnv("BD_DEBUG") === "true" ?  new CustomLogger() : undefined,
            }).then((connection) => {
                OrmFacade.orm = connection;
                resolve();
            }, reject)
                .catch((error) => {
                    Logger.error(Lang.__("Could not connect to {{driver}} server on [{{host}}:{{port}}].", {
                        host: getEnv("DB_HOST", "localhost"),
                        port: getEnv("DB_PORT", "5432"),
                        driver: getEnv("DB_TYPE", "postgres"),
                    }));

                    logCatchedException(error);
                });
        });
    }
}
