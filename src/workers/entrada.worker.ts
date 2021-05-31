import { BaseWorker } from "../framework/queue";
import { Job } from "bullmq";
import { Mensaje } from "../models/mensaje";
import { OrmFacade } from "../framework/orm_facade";
import { Logger } from "../framework/logger";

export default class EntradaWorker extends BaseWorker {

    handler(job: Job): any {
        if (job.name === "debito") {
            const data = JSON.parse(job.data);

            Logger.trace(JSON.stringify(data, null, 4));

            let mensaje = new Mensaje();

            mensaje.MsgId = data.CstmrDrctDbtInitn.GrpHdr.MsgId;
            mensaje.CreDtTm = data.CstmrDrctDbtInitn.GrpHdr.CreDtTm;
            mensaje.NbOfTxs = data.CstmrDrctDbtInitn.GrpHdr.NbOfTxs;
            mensaje.Amount = data.CstmrDrctDbtInitn.GrpHdr.CtrlSum.Amt;
            mensaje.Ccy = data.CstmrDrctDbtInitn.GrpHdr.CtrlSum.Ccy;
            mensaje.IntrBkSttlmDt = data.CstmrDrctDbtInitn.GrpHdr.IntrBkSttlmDt;
            mensaje.LclInstrm = data.CstmrDrctDbtInitn.GrpHdr.LclInstrm;
            mensaje.Channel = data.CstmrDrctDbtInitn.GrpHdr.Channel;

            OrmFacade.em.persist(mensaje).flush();
        }
    }

    protected fillInstance(instance: any, data: any[], scheme: {key: string; value: any}[]) {
        for (const iterator of scheme) {
            
        }
    }
}
