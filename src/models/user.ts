import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Model } from "./model";

@Entity()
export class User extends Model  {
    @PrimaryGeneratedColumn()
    Id!: string;

    @Column()
    Name!: string;

    @Column()
    Email?: string;

    @Column()
    Password!: string;
}
