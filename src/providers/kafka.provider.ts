import { dummyCallback, getEnv, Lang, logCatchedError, logCatchedException, Logger, ServiceProvider } from "@ant/framework";
import { Admin, Consumer, Kafka, LogEntry, logLevel, Message, Producer } from "kafkajs";
import { snakeCase } from "typeorm/util/StringUtils";

export class KafkaFacade {
    public static kafka: Kafka;
    public static producer: Producer;

    public static produce(topic: string, message: Message[]): void {
        Logger.debug(`Producing message to topic [${topic}]`);

        KafkaFacade.producer.send({
            topic: topic,
            messages: message,
        }).then(metadata => {
            for (const data of metadata) {
                Logger.debug(`Message successfully produced to topic [${data.topicName}(#${data.partition})].`);
                Logger.trace("Message produced: " + JSON.stringify(message, null, 4));
            }
        }, error => {
            Logger.error(`Error producing a message to topic [${topic}]`);
            Logger.error("Message: " + JSON.stringify(message, null, 4));
            logCatchedError(error);
        })
            .catch(logCatchedError)
        ;
    }

    public static async getConsumer(groupId?: string): Promise<Consumer> {
        const consumer =  KafkaFacade.kafka.consumer({
            groupId: groupId || snakeCase(getEnv("KAFKA_CONSUMER_GROUP_ID")),
            allowAutoTopicCreation: false,
        });

        await consumer.connect()
            .catch(logCatchedError)
        ;

        return consumer;
    }

    public static async getAdmin(): Promise<Admin> {
        const admin =  KafkaFacade.kafka.admin();
        await admin.connect()
            .catch(logCatchedError)
        ;

        return admin;
    }
}

export function kafkaLogger() {
    return (entry: LogEntry): void => {
        switch (entry.label) {
        case 'ERROR':
        case 'NOTHING':
            logCatchedError({
                name: entry.log.namespace,
                message: JSON.stringify(entry, null, 4),
                stack: entry.log.stack
            });
            break;

        case 'WARN':
            Logger.warn(JSON.stringify(entry, null, 4));
            break;

        case 'INFO':
            Logger.info(JSON.stringify(entry, null, 4));
            break;

        case 'DEBUG':
            Logger.audit(JSON.stringify(entry, null, 4));
            break;

        default:
            Logger.audit(JSON.stringify(entry, null, 4));
            break;
        }
    }
}

export default class KafkaProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise((resolve, reject) => {
            const brokers = getEnv("KAFKA_BROKERS", "localhost:9092");

            const kafka = new Kafka({
                clientId: snakeCase(getEnv("KAFKA_CLIENT_ID")),
                brokers: brokers.split(','),
                retry: {
                    retries: parseInt(getEnv("KAFKA_RETRY_TIMES", "3"))
                },
                logLevel: logLevel.NOTHING,
                logCreator: () => dummyCallback
            });

            const producer = kafka.producer({
                allowAutoTopicCreation: false,
                transactionTimeout: 2000
            })


            producer.connect().then(async () => {
                KafkaFacade.kafka = kafka;
                KafkaFacade.producer = producer;

                Logger.info(Lang.__("Kafka producer successfully connected to kafka broker(s) on [{{brokers}}].", {
                    brokers: brokers
                }));
                
                Logger.audit(Lang.__("Consumers set up started."));

                if (this.boostrap.consumers.length > 0) {
                    for (const consumerClass of this.boostrap.consumers) {
                        const consumer = new consumerClass();

                        Logger.audit(Lang.__("Preparing consumer [{{name}}({{group}})] on topic [{{topic}}].", {
                            name: consumer.constructor.name,
                            group: consumer.groupId,
                            topic: consumer.topic,
                        }))

                        const baseConsumer = await KafkaFacade.getConsumer(consumer.groupId).catch(logCatchedError)
    
                        await consumer.boot(baseConsumer as any).then(() => {
                            Logger.audit(Lang.__("Consumer [{{name}}({{group}})] on topic [{{topic}}] is ready.", {
                                name: consumer.constructor.name,
                                group: consumer.groupId,
                                topic: consumer.topic,
                            }))
                        });

                        consumer.doHandle();
                    }

                    Logger.audit(Lang.__("Consumers set up completed [{{count}}].", {
                        count: this.boostrap.consumers.length.toString()
                    }));
                } else {
                    Logger.audit(Lang.__("No consumers found."));
                }

                resolve();
   
            }, error => {
                Logger.error(`Kafka producer cannot connect to kafka broker(s) [${brokers}].`);
                logCatchedError(error);
                reject(error);
            })
                .catch(logCatchedException)
            ;
        });
    }
}
