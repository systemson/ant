import { BaseRoute } from "../framework/router";
import { Request, Response } from "express";
import { Lang } from "../framework/lang";

export class InfoRoute extends BaseRoute {
    url = "/info";

    handle(req: Request, res: Response): Response {
        return res.send({ status: Lang.__("active")});
    } 
}