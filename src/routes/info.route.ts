import { BaseRoute, Method, response, Response } from "../framework/router";
import { getEnv, Lang } from "../framework/helpers";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "get";

    handle(): Response {
        return response({
            status: Lang.__("active"),
            message:  Lang.__("The [{{name}}] microservice is up and running.", {
                name: getEnv("APP_NAME", "Ant"),
            }),
        });
    } 
}
