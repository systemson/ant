import {
    BaseRoute,
    EventEmitter,
    Method,
    Request,
    response,
    Response
} from "@ant/framework";
import { Lang } from "@ant/framework";

export class TestEventRoute extends BaseRoute {
    url = "/event/test";

    method: Method = "post";

    async handle(req: Request): Promise<Response> {
        const data = req.body;

        EventEmitter.emit("test", data);

        return response().json({
            status: Lang.__("ok"),
        });
    } 
}
