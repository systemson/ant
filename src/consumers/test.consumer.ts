import { BaseConsumer, Lang, Logger } from "@ant/framework";
import { EachMessagePayload } from "kafkajs";

export class TestConsumer extends BaseConsumer {
    handler(value: unknown, payload: EachMessagePayload): Promise<void> {
        return new Promise((resolve) => {

            Logger.debug(Lang.__("Running test consumer"));
            Logger.trace(JSON.stringify(value, null, 4));
            Logger.audit(JSON.stringify(payload, null, 4));
            resolve();
        })
    }
}
