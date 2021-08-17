import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { DatabaseLoggerProvider } from "../framework/logger";
import { Model } from "../framework/model";

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
