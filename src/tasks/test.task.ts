import { Lang, Logger, now, sleep } from "@ant/framework";
import { BaseTask } from "@ant/framework/lib/src/scheduler";

export class TestTask extends BaseTask {
    name = "test_task";
    cronExpression = "* * * * * *";

    handler(): Promise<void> {
        return new Promise((success) => {
            sleep(5000).then(() => {
                Logger.debug(Lang.__("Running test task."));
                Logger.audit(now().toDate().toDateString());
                success();
            });
        });
    }
}
