import { BaseRoute, Method, response, Response } from "../framework/router";
import { OrmFacade } from "../framework/orm_facade";
import { User } from "../models/user";

export class UserListRoute extends BaseRoute {
    url = "/api/users";

    method: Method = "get";

    async handle(): Promise<Response> {
        const body = await OrmFacade.em.getRepository(User).findAll();

        return response(body);
    } 
}
