import { ServiceProvider } from "../framework/service_provider";
import { getEnv, logCatchedException } from "../framework/helpers";
import { OrmFacade } from "../framework/orm_facade";
import { Logger } from "../framework/logger";
import { Lang } from "../framework/lang";
import { createConnection } from "typeorm";
import { DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";

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

export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            createConnection({
                type: getEnv("DB_TYPE", "postgres") as any,
                host: getEnv("DB_HOST", "localhost"),
                port: parseInt(getEnv("DB_PORT", "5432")),
                username: getEnv("DB_USERNAME", "postgres"),
                password: getEnv("DB_PASSWORD", "postgres"),
                database: getEnv("DB_DATABASE"),
                schema:  getEnv("DB_SCHEMA", "public"),
                entities: getEnv("APP_MODE", "develop") === "compiled" ? ["./build/src/models/**/*.js"] : ["./src/models/**/*.ts"],
                entityPrefix: getEnv("BD_PREFIX"),
                synchronize: false,
                dropSchema: false,
                namingStrategy: new SnakeCaseNamingStrategy(),
            }).then((connection) => {
                resolve();

                OrmFacade.orm = connection;
                Logger.audit(Lang.__("ORM [{{name}}] started.", {
                    name: "TypeORM",
                }));
            })
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
