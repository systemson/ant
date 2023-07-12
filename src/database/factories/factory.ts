import { Lang, Logger, Model } from "@ant/framework";
import { faker } from "@faker-js/faker";

export abstract class Factory<T extends Model>  {
    faker = faker;

    abstract model: new () => T;

    abstract definition(index: number): Partial<T>;

    withModel(model: new () => T) {
        this.model = model;

        return this;
    }

    count(num: number): ModelCollection<T> {
        const models: T[] = [];

        for (let i = 0; i < num; i++) {
            const model = new this.model();

            models.push(Object.assign(model, this.definition(i)));
        }

        return new ModelCollection<T>(this.model as any, models);
    }
}


export class ModelCollection<T extends Model> {
    constructor(
        public classModel: typeof Model,
        public models: T[]
    ) { }

    alter(data: (index: number) => Partial<T>): ModelCollection<T> {
        this.models.forEach((item: T, index, array: T[]) => Object.assign(item, data(index)));

        return this;
    }

    async save(): Promise<void> {
        const n = 100;
        const total = this.models.length;
        const tableName = this.classModel.getRepository().metadata.tableName;

        Logger.trace(Lang.__("Seeding [{{items}}] items on table [{{table}}].", {
            table: tableName,
            items: total.toString(),
        }));

        while (this.models.length >= n) {
            const models = this.models.slice(this.models.length - n, this.models.length);
            this.models = this.models.slice(0, -n)

            await this.classModel.insert(models);
        }

        await this.classModel.insert(this.models);

        Logger.trace(Lang.__("Seeded [{{items}}] items on table [{{table}}].", {
            table: tableName,
            items: total.toString(),
        }));
    }
}
