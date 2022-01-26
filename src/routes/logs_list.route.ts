import { BaseRoute, Method, Request, response, Response } from "@ant/framework";
import { Log } from "../models/log";

export class LogsListRoute extends BaseRoute {
    url = "/api/logs";

    method: Method = "get";

    async handle(req: Request): Promise<Response> {
        return response(await Log.paginate(req));
    }
}
