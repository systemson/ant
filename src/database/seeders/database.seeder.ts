import { Lang, logCatchedException, Logger, logTypeORMCatchedError, Model } from "@ant/framework";

export abstract class Seeder {
    abstract seeders(): (() => Promise<void | Model[]>)[];

    async run(): Promise<void> {
        for (const seeder of this.seeders()) {
            const name = seeder.name;

            Logger.trace(Lang.__("Starting seeder [{{name}}]", {
                name: name,
            }));

            await seeder().catch((error) => {
                logTypeORMCatchedError(error)
                logCatchedException(error)
            });

            Logger.trace(Lang.__("Finishing seeder [{{name}}]", {
                name: name,
            }));
        }
    }

}

export class DatabaseSeeder extends Seeder {
    seeders(): (() => Promise<void | Model[]>)[] {
        return [
            //
        ]
    }
}
