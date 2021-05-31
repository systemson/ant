import { Connection, EntityManager, IDatabaseDriver, MikroORM } from "@mikro-orm/core";

export class OrmFacade {
    protected static ormInstance: MikroORM<IDatabaseDriver<Connection>>;

    public static set orm(orm: MikroORM<IDatabaseDriver<Connection>>) {
        this.ormInstance = orm;
    }

    public static get orm():  MikroORM<IDatabaseDriver<Connection>> {
        return this.ormInstance;
    }

    public static get em(): EntityManager<IDatabaseDriver<Connection>> {
        return this.ormInstance.em;
    }
}
