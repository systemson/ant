import { getEnv, Lang, logCatchedError, logCatchedException, Logger, now, ServiceProvider } from "@ant/framework";
import { Admin, Consumer, Kafka, LogEntry, logLevel, Message, Producer, ITopicConfig } from "kafkajs";
import { snakeCase } from "typeorm/util/StringUtils";

export class KafkaFacade {
    public static kafka: Kafka;
    public static producer: Producer;

    public static produce(topic: string, message: Message[]): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.debug(`Producing message to topic [${topic}]`);

            KafkaFacade.producer.send({
                topic: topic,
                messages: message,
            }).then(metadata => {
                for (const data of metadata) {
                    Logger.debug(`Message successfully produced to topic [${data.topicName}(#${data.partition})].`);
                    Logger.trace("Message produced: " + JSON.stringify(message, null, 4));
                }

                resolve();
            }, error => {
                Logger.error(`Error producing a message to topic [${topic}]`);
                Logger.trace("Message: " + JSON.stringify(message, null, 4));
                logCatchedError(error);
                reject(error);
            })
                .catch(logCatchedError)
            ;
        })
    }

    public static stream(topic: string, data: unknown): Promise<void> {
        return KafkaFacade.produce(topic, [
            {
                value: JSON.stringify(KafkaFacade.prepareStream(topic, data))
            }
        ]);
    }

    public static retry(stream: MessageStream): Promise<void> {
        if (stream.retries >= parseInt(getEnv("KAFKA_MAX_RETRIES", "3"))) {
            const msg = Lang.__("Maximum retries attempts [{{retries}}] reached on [{{topic}}]", {
                retries: stream.retries.toString(),
                topic: stream.topic
            });

            Logger.error(msg);
            Logger.trace(JSON.stringify(stream.body, null, 4));
            throw new Error(msg);
        } else {
            stream.retries++;

            return KafkaFacade.produce(stream.topic, [
                {
                    value: JSON.stringify(stream)
                }
            ])
        }
    }
    
    protected static prepareStream(topic: string, data: unknown, retries = 0): MessageStream {
        return {
            body: data,
            timestamp: parseInt(now().format('x')),
            retries: retries,
            topic: topic,
        }
    }

    public static async getConsumer(groupId: string): Promise<Consumer> {
        const consumer =  KafkaFacade.kafka.consumer({
            groupId: groupId || snakeCase(getEnv("KAFKA_DEFAULT_CONSUMER_GROUP_ID")),
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

export type MessageStream = {
    body: any;
    timestamp: number;
    retries: number;
    topic: string;
}

export function kafkaLogger() {
    return (entry: LogEntry): void => {
        const body = JSON.stringify(entry, null, 4);

        switch (entry.label) {
        case 'ERROR':
            logCatchedError({
                name: entry.log.namespace,
                message: body,
                stack: entry.log.stack
            });
            break;

        case 'WARN':
            Logger.warn(body);
            break;

        case 'INFO':
            Logger.info(body);
            break;

        case 'DEBUG':
            Logger.audit(body);
            break;

        default:
            Logger.audit(body);
            break;
        }
    }
}

export default class KafkaProvider extends ServiceProvider {
    boot(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const brokers = getEnv("KAFKA_BROKERS", "localhost:9092");

            const kafka = new Kafka({
                clientId: snakeCase(getEnv("KAFKA_CLIENT_ID")),
                brokers: brokers.split(','),
                retry: {
                    retries: parseInt(getEnv("KAFKA_RETRY_TIMES", "3"))
                },
                logLevel: logLevel.ERROR,
                logCreator: () => kafkaLogger
            });

            const admin = kafka.admin();

            if (getEnv("KAFKA_CREATE_TOPICS_ON_START", "false") == "true") {
                await admin.connect().then(async () => {
                    const raw = getEnv("KAFKA_TOPICS", "default_topic").split(",");
                    const topics: ITopicConfig[] = [];
        
                    for (const topic of raw) {
                        topics.push({
                            topic: topic,
                            numPartitions:  parseInt(getEnv("KAFKA_NUM_PARTITIONS", "1"))
                        });
                    }
                    const current = await admin.listTopics();
    
                    Logger.debug(`Current topics: ` + JSON.stringify(current, null, 4));
    
                    await admin.createTopics({
                        waitForLeaders: true,
                        topics: topics
                    }).then(result => {
                        if (result) {
                            Logger.debug(`Topics [${raw}] successfully created.`)
                        } else {
                            Logger.debug(`Topics [${raw}] were not created.`)
                        }
                    }, error => {
                        logCatchedException(error)
                    })
                        .catch(logCatchedException)
                    ;
                }, error => {
                    Logger.error(`Kafka admin cannot connect to kafka broker(s) [${brokers}].`);
                    logCatchedException(error);
                    reject(error);
                })
                    .catch(logCatchedException)
                ;
            }

            const producer = kafka.producer({
                allowAutoTopicCreation: false,
                transactionTimeout: 2000
            });

            await producer.connect().then(async () => {
                KafkaFacade.kafka = kafka;
                KafkaFacade.producer = producer;

                Logger.debug(Lang.__("Kafka producer successfully connected to kafka broker(s) on [{{brokers}}].", {
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
                logCatchedException(error);
                reject(error);
            })
                .catch(logCatchedException)
            ;
        });
    }
}
