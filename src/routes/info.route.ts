import { BaseRoute, Method } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";

export class InfoRoute extends BaseRoute {
    url = "/info";

    method: Method = "get";

    handle(req: Request, res: Response): void {
        res.send({ status: Lang.__("active")});
    } 
}