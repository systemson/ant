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

export class HomeRoute extends BaseRoute {
    url = "/";

    method: Method = "get";

    handle(): Response {
        return response({
            status: Lang.__("active"),
            message:  Lang.__("Welcome to the [{{name}}] microservice.", {
                name: getEnv("APP_NAME", "Ant"),
            }),
        });
    } 
}
