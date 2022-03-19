import { getEnv, Lang, Logger, ServiceProvider } from "@ant/framework";
import { SchedulerFacade } from "../framework/scheduler";

export default class TasksProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            for (const taskClass of this.boostrap.tasks) {
                for (let index = 0; index < parseInt(getEnv("APP_TASK_CONCURRENCY", "1")); index++) {
                    const task = new taskClass();
                    task.id = index;

                    SchedulerFacade.schedule(task);

                    Logger.audit(Lang.__("Scheduling task {{name}}", {
                        name: `${task.constructor.name}(#${index})`,
                    }));
                }
            }

            resolve();
        });
    }
}
