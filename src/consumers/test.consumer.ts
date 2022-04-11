import { BaseConsumer, getEnv } from "@ant/framework";
import { EachMessagePayload } from "kafkajs";
import { snakeCase } from "typeorm/util/StringUtils";

export class TestConsumer extends BaseConsumer {
    public groupId = snakeCase(getEnv("KAFKA_CONSUMER_GROUP_ID", "my-group"));
    
    handler(payload: EachMessagePayload): Promise<void> {
        return new Promise((resolve) => {

            console.log(payload.message.value?.toString());
            resolve();
        })
    }
}

