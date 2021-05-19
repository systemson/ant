import { Request, RequestHandler, Response } from "express";

export type RouterConfig = {
    scheme?: string;
    host?: string;
    port: string;
}

/**
 * The HTTP Rest methods.
 */
type Method = "get" | "post" | "put" | "patch" | "delete";

export type RouteOptions = {
    name?: string;
    method: Method,
    callback: RequestHandler,
}

export interface RouteContract {
    url: string;
    method: Method;

    handle(req: Request, res: Response): Response;
}

export abstract class BaseRoute implements RouteContract {
    url = "/";
    method: Method = "get";

    abstract handle(req: Request, res: Response): Response;
}
