import {
    BaseRoute,
    Method,
    response,
    Response
} from "@ant/framework";
import {
    getEnv,
    Lang
} from "@ant/framework";
import { KafkaFacade } from "../providers/kafka.provider";

export class KafkaRoute extends BaseRoute {
    url = "/api/kafka/test";

    method: Method = "get";

    handle(): Promise<Response> {
        return new Promise((success) => {
            KafkaFacade.stream(getEnv("KAFKA_DEFAULT_TOPIC", "test-topic"), [
                { value: Lang.__("Hello world.") },
            ]);

            success(response({
                status: Lang.__("success"),
            }));
        });
    } 
}
