import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Mensaje {

    @PrimaryKey()
    IdMensaje!: string;

    @Property()
    MsgId!: string;

    @Property()
    CreDtTm = new Date();

    @Property()
    NbOfTxs!: number;

    @Property()
    Amount!: number;

    @Property()
    Ccy!: string;

    @Property()
    IntrBkSttlmDt!: string;

    @Property()
    LclInstrm!: string;

    @Property()
    Channel!: string;

    @Property()
    StMensaje: string = 'RECIBIDO';

}