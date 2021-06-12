import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
    @PrimaryKey()
    Id!: string;

    @Property()
    Name!: string;

    @Property()
    Email?: string;

    @Property()
    Password!: string;
}
