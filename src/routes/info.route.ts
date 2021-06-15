import { BaseRoute, Method, Request, Response } from "../framework/router";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/functions";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "get";

    handle(req: Request, res: Response): Response {
        return res.setData({
            status: Lang.__("active"),
            message:  Lang.__("The [{{name}}] microservice is up and running.", {
                name: getEnv("APP_NAME", "Micra"),
            }),
        });
    } 
}
