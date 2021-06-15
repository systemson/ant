import { BaseRoute, Method } from "../framework/router";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/functions";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "get";

    handle(): any {
        return {
            status: Lang.__("active"),
            message:  Lang.__("The [{{name}}] microservice is up and running.", {
                name: getEnv("APP_NAME", "Micra"),
            }),
        };
    } 
}
