import { Lang, Logger, ServiceProvider } from "@ant/framework";
import { SchedulerFacade } from "@ant/framework/lib/src/scheduler";

export default class TasksProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            for (const taskClass of this.boostrap.tasks) {
                const task = new taskClass();

                SchedulerFacade.schedule(task);

                Logger.audit(Lang.__("Scheduling task {{name}}", {
                    name: `${task.constructor.name}`,
                }));
            }

            resolve();
        });
    }
}
