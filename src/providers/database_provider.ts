import { MikroORM, NamingStrategy, ReflectMetadataProvider } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { ServiceProvider } from "../framework/service_provider";
import { getEnv, logCatchedException } from "../framework/helpers";
import { OrmFacade } from "../framework/orm_facade";
import { Logger } from "../framework/logger";
import { Lang } from "../framework/lang";

class CustomNamingStrategy implements NamingStrategy {
    getClassName(file: string): string {
        return this.snakeCaseToCamelCase(file);
    }
    classToMigrationName(timestamp: string): string {
        return timestamp;
    }
    classToTableName(entityName: string) {
        return getEnv("BD_PREFIX")+this.camelCaseToSnakeCase(entityName);
    }
    joinColumnName(propertyName: string) {
        return this.camelCaseToSnakeCase(propertyName) + "_" + this.referenceColumnName();
    }
    joinKeyColumnName(entityName: string, referencedColumnName: string) {
        return this.classToTableName(entityName) + "_" + (referencedColumnName || this.referenceColumnName());
    }
    joinTableName(sourceEntity: string, targetEntity: string, propertyName: string) {
        return this.classToTableName(sourceEntity) + "_" + this.classToTableName(propertyName);
    }
    propertyToColumnName(propertyName: string) {
        return this.camelCaseToSnakeCase(propertyName);
    }
    referenceColumnName() {
        return "id";
    }

    protected camelCaseToSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace("_", "");
    }

    protected snakeCaseToCamelCase(userInput: string) {
        const userInputSplit = userInput.split("_");
        let x = 0;
        let userOutPut = "";
        for (const prm of userInputSplit) {
            if (x === 0) {
                userOutPut = prm.toLowerCase();
            } else {
                userOutPut += prm.substr(0, 1).toUpperCase() + prm.substr(1).toLowerCase();
            }
            x++;
        } 
        return userOutPut;
    }
}

export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise(() => {
            MikroORM.init({
                entities: getEnv("APP_MODE", "develop") === "compiled" ? ["./build/src/models/**/*.js"] : ["./src/models/**/*.ts"],
                type: getEnv("DB_TYPE", "postgresql") as "mongo" | "mysql" | "mariadb" | "postgresql" | "sqlite",
                dbName: getEnv("DB_DATABASE"),
                host: getEnv("DB_HOST", "localhost"),
                port: parseInt(getEnv("DB_PORT", "5432")),
                user: getEnv("DB_USERNAME", "postgres"),
                password:  getEnv("DB_PASSWORD", "postgres"),
                strict: true,
                metadataProvider: getEnv("APP_MODE", "develop") === "compiled" ? ReflectMetadataProvider : TsMorphMetadataProvider,
                namingStrategy: CustomNamingStrategy,
                cache: {
                    pretty: true,
                    options: {
                        cacheDir: "./build/tmp"
                    }
                },
            }).then((orm) => {
                OrmFacade.orm = orm;
                Logger.audit(Lang.__("ORM [{{name}}] started.", {
                    name: orm.constructor.name,
                }));
            }).catch(logCatchedException);
        });
    }
}
