import { BaseRoute, Method } from "../framework/router";
import { OrmFacade } from "../framework/orm_facade";
import { User } from "../models/user";

export class UserListRoute extends BaseRoute {
    url = "/api/users";

    method: Method = "get";

    handle(): Promise<any> {
        return OrmFacade.em.getRepository(User).findAll();
    } 
}
