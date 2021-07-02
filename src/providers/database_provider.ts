import { ServiceProvider } from "../framework/service_provider";
import { getEnv, logCatchedException } from "../framework/helpers";
import { OrmFacade } from "../framework/orm_facade";
import { Logger } from "../framework/logger";
import { Lang } from "../framework/lang";
import { createConnection } from "typeorm";
/*
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
*/
export default class DatabaseProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            createConnection({
                type: getEnv("DB_TYPE", "postgresql") as any,
                host: getEnv("DB_HOST", "localhost"),
                port: parseInt(getEnv("DB_PORT", "5432")),
                username: getEnv("DB_USERNAME", "postgres"),
                password: getEnv("DB_PASSWORD", "postgres"),
                database: getEnv("DB_DATABASE"),
                schema:  getEnv("DB_SCHEMA", "public"),
                entities: getEnv("APP_MODE", "develop") === "compiled" ? ["./build/src/models/**/*.js"] : ["./src/models/**/*.ts"],
                //entities: ['./src/models/*.ts'],
                entityPrefix: getEnv("BD_PREFIX"),
                synchronize: false,
                dropSchema: false,
            }).then((connection) => {
                resolve();

                OrmFacade.orm = connection;
                Logger.audit(Lang.__("ORM [{{name}}] started.", {
                    name: connection.constructor.name,
                }));
            }, reject).catch(logCatchedException);
        });
    }
}
