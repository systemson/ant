import { BaseRoute, Method, response, Response } from "../framework/router";
import { User } from "../models/user";

export class UserListRoute extends BaseRoute {
    url = "/api/users";

    method: Method = "get";

    async handle(): Promise<Response> {
        const body = await User.find();

        return response(body);
    } 
}
