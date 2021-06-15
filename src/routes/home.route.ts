import { BaseRoute, Method } from "../framework/router";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/functions";

export class HomeRoute extends BaseRoute {
    url = "/";

    method: Method = "get";

    handle(): any {
        return {
            status: Lang.__("active"),
            message:  Lang.__("Welcome to the [{{name}}] microservice.", {
                name: getEnv("APP_NAME", "Micra"),
            }),
        };
    } 
}
