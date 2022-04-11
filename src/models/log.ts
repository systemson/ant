import {
    Model,
    DatabaseLoggerProvider
} from "@ant/framework";
import {
    Column,
    Entity,
    PrimaryGeneratedColumn
} from "typeorm";

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
