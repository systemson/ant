import { EventEmitter, getEnv, Lang, Logger, ServiceProvider } from "@ant/framework";
import { EventEmitter as NodeEventEmitter } from 'events';

export class EventProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve) => {
            const driverName = getEnv('APP_EVENT_DRIVER', 'default');

            try {
                if (['default', 'node'].includes(driverName)) {
                    EventEmitter.driver = new NodeEventEmitter();
                } else if (driverName == 'database') {
                    //EventEmitter.driver = new SqlEventEmitter();
                } else {
                    throw new Error(Lang.__(`Invalid event driver name [{{driver}}]`, {
                        driver: driverName,
                    }));
                }
            } catch (error: any) {
                throw error;
            }

            for (const listenerClass of this.boostrap.listeners) {
                const listener = new listenerClass();

                Logger.audit(Lang.__("Registering listener [{{listener}}] on event [{{eventName}}]", {
                    listener: listener.constructor.name,
                    eventName: listener.eventName,
                }));

                EventEmitter.listen(listener.eventName, listener);
            }

            resolve();
        })
    }
}
