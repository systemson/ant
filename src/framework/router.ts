import { Request as ExpressRequest, Response as ExpressResponse, RequestHandler } from "express";

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

    handle(req: Request): Promise<Response> | Response;
    
    doHandle(req: Request): Promise<Response>;

    onCompleted(req: Request): void;
    onFailed(req: Request, error?: unknown): void;
}

export interface Response {
    setData(data: unknown): Response;
    getData(): unknown;

    setStatus(code: number): Response;
    getStatus(): number;

    setHeaders(headers: any): Response;
    getHeaders(): any;

    fill(ressponse: ExpressResponse): ExpressResponse;
}

export type Request = ExpressRequest

export class ResponseContainer implements Response {
    protected content?: any;

    protected codeStatus = 200;

    protected headers: any = {};

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

    setHeaders(headers: {
        [key: string]: string;
    }): Response {
        this.headers = headers;

        return this;
    }

    getHeaders(): {
        [key: string]: string;
        } {
        return this.headers;
    }

    fill(response: ExpressResponse): ExpressResponse {
        return response
            .status(this.getStatus())
            .header(this.getHeaders())
            .json(this.getData())
        ;
    }
}

export function response(body: unknown, code = 200, headers = {}): Response {
    return (new ResponseContainer()).setData(body).setStatus(code).setHeaders(headers);
}

export abstract class BaseRoute implements RouteContract {
    url = "/";

    abstract method: Method;

    abstract handle(req: Request): Promise<Response> | Response;

    doHandle(req: Request): Promise<Response> {
        const response = this.handle(req);

        if (response instanceof Promise) {
            return response;
        }

        return new Promise((resolve) => {
            resolve(response as Response);
        });
    }

    onCompleted(req: Request): void {
        //
    }

    onFailed(req: Request, error?: unknown): void {
        //
    }
}
