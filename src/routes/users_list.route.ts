import { BaseRoute, Method, Request, Response } from "../framework/router";
import { OrmFacade } from "../framework/orm_facade";
import { User } from "../models/user";

export class UserListRoute extends BaseRoute {
    url = "/api/users";

    method: Method = "get";

    handle(req: Request, res: Response): Promise<Response> {
        return OrmFacade.em.getRepository(User).findAll().then(res.setData);
    } 
}
