import { MikroORM, NamingStrategy } from "@mikro-orm/core";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { ServiceProviderContract } from "../bootstrap";
import { getEnv } from "../framework/functions";
import { OrmFacade } from "../framework/orm_facade";

class CustomNamingStrategy implements NamingStrategy {
    getClassName(file: string, separator?: string): string {
        return this.snakeCaseToCamelCase(file);
    }
    classToMigrationName(timestamp: string): string {
        return timestamp;
    }
    classToTableName(entityName: string) {
        return getEnv('BD_PREFIX')+this.camelCaseToSnakeCase(entityName);
    }
    joinColumnName(propertyName: string) {
        return this.camelCaseToSnakeCase(propertyName) + '_' + this.referenceColumnName();
    }
    joinKeyColumnName(entityName: string, referencedColumnName: string) {
        return this.classToTableName(entityName) + '_' + (referencedColumnName || this.referenceColumnName());
    }
    joinTableName(sourceEntity: string, targetEntity: string, propertyName: string) {
        return this.classToTableName(sourceEntity) + '_' + this.classToTableName(propertyName);
    }
    propertyToColumnName(propertyName: string) {
        return this.camelCaseToSnakeCase(propertyName);
    }
    referenceColumnName() {
        return 'id';
    }

    protected camelCaseToSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace('_', '')
    }

    protected snakeCaseToCamelCase(userInput: string) {
        const userInputSplit = userInput.split('_');
        let x = 0;
        let userOutPut: string = '';
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

export default class DatabaseProvider implements ServiceProviderContract {
    boot(): Promise<void> {
        return new Promise(async () => {
            OrmFacade.orm = await MikroORM.init({
                entities: ['./src/models/**/*.ts'],
                dbName: getEnv('DB_NAME'),
                type: getEnv('DB_DRIVER') as "mongo" | "mysql" | "mariadb" | "postgresql" | "sqlite" | undefined,
                metadataProvider: TsMorphMetadataProvider,
                namingStrategy: CustomNamingStrategy,
                cache: { enabled: false },
                //clientUrl: '...', // defaults to 'mongodb://localhost:27017' for mongodb driver
            });
        });
    }
}
