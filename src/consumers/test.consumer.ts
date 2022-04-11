import { BaseConsumer, getEnv, Lang, Logger } from "@ant/framework";
import { EachMessagePayload } from "kafkajs";
import { snakeCase } from "typeorm/util/StringUtils";

export class TestConsumer extends BaseConsumer {
    public groupId = snakeCase(getEnv("KAFKA_CONSUMER_GROUP_ID", "my-group"));
    
    handler(payload: EachMessagePayload): Promise<void> {
        return new Promise((resolve) => {

            Logger.debug(Lang.__("Running test consumer"));
            Logger.audit(payload.message.value?.toString() || "");
            resolve();
        })
    }
}

