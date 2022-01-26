import { Model, DatabaseLoggerProvider } from "@ant/framework";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Log extends Model implements DatabaseLoggerProvider {
    @PrimaryGeneratedColumn()
    Id!: string;

    @Column()
    Message!: string;

    @Column()
    LogLevel!: string;

    @Column()
    Date!: Date;
}
