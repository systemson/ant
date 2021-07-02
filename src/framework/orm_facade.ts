import { Connection } from "typeorm";

export class OrmFacade {
    protected static ormInstance: Connection;

    public static set orm(orm: Connection) {
        this.ormInstance = orm;
    }

    public static get orm():  Connection {
        return this.ormInstance;
    }

    public static get em(): any {
        //return this.ormInstance.em.fork();
        return;
    }
}
