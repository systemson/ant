import { Lang } from "@ant/framework";
import { BaseTask } from "@ant/framework/lib/src/scheduler";
import { KafkaFacade } from "../providers/kafka.provider";

export class KafkaTask extends BaseTask {
    name = "kasfka_task";
    cronExpression = "*/30 * * * * *";

    handler(): Promise<void> {
        return new Promise((resolve, reject) => {
            KafkaFacade.stream("default-topic", [
                { value: Lang.__("Hello world.") },
            ]).then(() => {

                resolve();

            }, reject)
                .catch(reject);
        });
    }
}
