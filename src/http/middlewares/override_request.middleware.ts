import { BaseMiddleware } from "@ant/framework";
import {
    Response as ExpressResponse,
    Request as ExpressRequest,
    NextFunction,
} from "express";
import RouterProvider from "../../providers/router.provider";

export class OverrideRequestMiddleware extends BaseMiddleware {
    async handle(req: ExpressRequest, _res: ExpressResponse, next: NextFunction) {
        req.getBasicAuth = function () {
            const token = RouterProvider.getToken(req, "basic");

            if (token) {
                const parts = atob(token).split(":");

                return new BasicAuthToken(parts[0], parts[1]);
            }
        }

        req.getBearer = function () {
            return RouterProvider.getToken(req, "bearer");
        }

        next();
    }
}

export class BasicAuthToken {
    constructor(
        public username: string,
        public password: string,
    ) {
        //
    }

    toBase64(): string {
        return btoa(`${this.username}:${this.password}`);
    }
}
