import { BaseTask } from "@ant/framework";

export class TestTask extends BaseTask {
    name = "operacion_entrada";

    handler(now: Date): Promise<void> {
        return new Promise((success) => {
            console.log(now);

            success();
        });
    }
}
