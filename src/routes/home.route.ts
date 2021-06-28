import { BaseRoute, Method, response, Response } from "../framework/router";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/helpers";

export class HomeRoute extends BaseRoute {
    url = "/";

    method: Method = "get";

    handle(): Response {
        return response({
            status: Lang.__("active"),
            message:  Lang.__("Welcome to the [{{name}}] microservice.", {
                name: getEnv("APP_NAME", "Micra"),
            }),
        });
    } 
}
