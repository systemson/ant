import {
    Lang,
    logCatchedException,
    Logger,
    ServiceProvider
} from "@ant/framework";
import { SchedulerFacade, TaskContract } from "@ant/framework/lib/src/scheduler";

export default class TasksProvider extends ServiceProvider {
    async boot(): Promise<void> {
        await this.setTask(this.boostrap.tasks)
            .then((count: number) => {
                Logger.audit(Lang.__("Tasks set up completed [{{count}}].", {
                    count: count.toString()
                }));
            }, (error) => {
                Logger.audit(Lang.__(error.message));
            })
            .catch(logCatchedException)
        ;
    }

    protected setTask(tasks: (new() => TaskContract)[]): Promise<number> {
        return new Promise((resolve, reject) => {
            if (tasks.length > 0) {
                for (const taskClass of tasks) {
                    const parent = new taskClass();
                    for (let index = 0; index < parent.concurrency; index++) {
                        const task = new taskClass();
                        task.setId(index + 1);

                        SchedulerFacade.schedule(task);
        
                        Logger.audit(Lang.__("Scheduling task [{{name}}(#{{id}})]", {
                            name: task.constructor.name,
                            id: task.getId().toString()
                        }));
                        
                        resolve(tasks.length);
                    }
                }
            } else {
                reject({
                    message: "No tasks found.",
                });
            }
        });
    }
}
