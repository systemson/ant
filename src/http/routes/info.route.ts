import {
    BaseRoute,
    Method,
    Request,
    response,
    Response
} from "@ant/framework";
import {
    getEnv,
    Lang
} from "@ant/framework";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "get";

    handle(req: Request): Response {
        const body = req.body;

        return response({
            status: Lang.__("active"),
            message:  Lang.__("The [{{name}}] microservice is up and running.", {
                name: getEnv("APP_NAME", "Ant"),
            }),
        });
    } 
}
