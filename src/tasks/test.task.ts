import { sleep } from "@ant/framework";
import { BaseTask } from "@ant/framework/lib/src/scheduler";

export class TestTask extends BaseTask {
    name = "test_task";
    cronExpression = "*/30 * * * * *";

    handler(now: Date): Promise<void> {
        return new Promise((success) => {
            sleep(5000).then(() => {
                console.log(now);
                success();
            });
        });
    }
}
