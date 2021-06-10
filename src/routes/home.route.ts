import { BaseRoute, Method } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";
import { getEnv } from "../framework/functions";

export class HomeRoute extends BaseRoute {
    url = "/";

    method: Method = "get";

    handle(req: Request, res: Response): void {
        res.send({
            status: Lang.__("active"),
            message:  Lang.__("The {{name}} microservice is running.", {
                name: getEnv("APP_NAME"),
            }),
        });
    } 
}