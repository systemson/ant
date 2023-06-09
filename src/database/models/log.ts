import {
    DatabaseLoggerProvider
} from "@ant/framework";
import {
    BaseEntity,
    Column,
    Entity,
    PrimaryGeneratedColumn
} from "typeorm";

@Entity()
export class Log extends BaseEntity implements DatabaseLoggerProvider {
    @PrimaryGeneratedColumn()
    Id!: string;

    @Column()
    Message!: string;

    @Column()
    LogLevel!: string;

    @Column()
    Date!: Date;
}
