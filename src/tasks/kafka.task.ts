import { getEnv, Lang } from "@ant/framework";
import { BaseTask } from "@ant/framework/lib/src/scheduler";
import { KafkaFacade } from "../providers/kafka.provider";

export class KafkaTask extends BaseTask {
    name = "kasfka_task";
    cronExpression = "*/30 * * * * *";

    handler(): Promise<void> {
        return new Promise((resolve) => {
            KafkaFacade.produce(getEnv("KAFKA_DEFAULT_TOPIC", "test-topic"), [
                { value: Lang.__("Hello world.") },
            ]);

            resolve();
        });
    }
}
