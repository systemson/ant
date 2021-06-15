import { Request as ExpressRequest, RequestHandler } from "express";

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

    handle(req: Request, res: Response): Promise<Response> | Response;
    
    doHandle(req: Request, res: Response): Promise<Response>;
}

export interface Response {
    setData(data: unknown): Response;
    getData(): unknown;

    setStatus(code: number): Response;
    getStatus(): number;
}

export type Request = ExpressRequest

export class ResponseContainer implements Response {
    protected content?: any;

    protected codeStatus = 200;

    setStatus(code: number): Response {
        this.codeStatus = code;

        return this;
    }

    setData(data: unknown): Response {
        this.content = data;

        return this;
    }

    getStatus(): number {
        return this.codeStatus;
    }

    getData(): unknown {
        return this.content;
    }

}

export abstract class BaseRoute implements RouteContract {
    url = "/";

    abstract method: Method;

    abstract handle(req: Request, res: Response): Promise<Response> | Response;

    doHandle(req: Request, res: Response): Promise<Response> {
        const response = this.handle(req, res);

        if (response instanceof Promise) {
            return response;
        }

        return new Promise((resolve) => {
            resolve(response as Response);
        });
    }
}
