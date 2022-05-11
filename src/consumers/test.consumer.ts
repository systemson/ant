import { BaseConsumer, Lang, Logger } from "@ant/framework";
import { EachMessagePayload } from "kafkajs";

export class TestConsumer extends BaseConsumer {
    topic = "default-topic";

    handler(data: unknown, payload: EachMessagePayload): Promise<void> {
        return new Promise(resolve => {

            Logger.debug(Lang.__("Running test consumer"));
            Logger.trace(data);
            Logger.audit(payload);
            resolve();
        })
    }
}
