import { BaseListener, Lang, Logger } from "@ant/framework";

export class TestListener extends BaseListener {
    eventName = "test";

    handler(data: any): void {
        Logger.debug(Lang.__("Data received in [{{name}}] by listener [{{listener}}].", {
            name: this.eventName,
            listener: this.constructor.name,
        }))

        Logger.trace(data);
    }
}
