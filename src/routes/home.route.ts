import { BaseRoute, Method, Request, Response } from "../framework/router";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/functions";

export class HomeRoute extends BaseRoute {
    url = "/";

    method: Method = "get";

    handle(req: Request, res: Response): Response {
        return res.setData({
            status: Lang.__("active"),
            message:  Lang.__("Welcome to the [{{name}}] microservice.", {
                name: getEnv("APP_NAME", "Micra"),
            }),
        });
    } 
}
