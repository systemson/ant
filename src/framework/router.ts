import { Request, RequestHandler } from "express";

export type RouterConfig = {
    scheme?: string;
    host?: string;
    port: string;
}

/**
 * The HTTP Rest methods.
 */
export type Method = "get" | "post" | "put" | "patch" | "delete";

export type RouteOptions = {
    name?: string;
    method: Method,
    callback: RequestHandler,
}

export interface RouteContract {
    url: string;
    method: Method;

    handle(req: Request): Promise<any> | any;
    
    doHandle(req: Request): Promise<any>;
}

export abstract class BaseRoute implements RouteContract {
    url = "/";

    abstract method: Method;

    abstract handle(req: Request): Promise<any> | any;

    doHandle(req: Request): Promise<any> {
        const response = this.handle(req);

        if (response instanceof Promise) {
            return response;
        }

        return new Promise((resolve) => {
            resolve(response);
        });
    }
}
