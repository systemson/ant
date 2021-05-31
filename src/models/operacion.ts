import { BaseEntity, Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Operacion {

  @PrimaryKey()
  id_operacion!: string;

  @Property()
  title!: string;

}