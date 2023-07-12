import {
    BaseRoute,
    Method,
    response,
    Response
} from "@ant/framework";
import { Log } from "../../database/models/log";

export class LogsListRoute extends BaseRoute {
    url = "/api/logs";

    method: Method = "get";

    async handle(): Promise<Response> {
        return response(await Log.find());
    }
}
