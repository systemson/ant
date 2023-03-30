import { getEnv, Lang, logCatchedError, logCatchedException, Logger, NODE_ENV, now, ServiceProvider, TIMESTAMP_FORMAT } from "@ant/framework";
import { Admin, Consumer, Kafka, LogEntry, logLevel, Message, Producer, ITopicConfig, ITopicPartitionConfig } from "kafkajs";
import moment from "moment";
import { snakeCase } from "typeorm/util/StringUtils";

export class KafkaFacade {
    public static kafka: Kafka;
    public static producer: Producer;

    protected static produce(topic: string, message: Message[]): Promise<void> {
        return new Promise((resolve, reject) => {
            Logger.debug(`Producing message to topic [${topic}]`);

            if (!KafkaFacade.producer) {
                throw new Error(Lang.__("Kafka producer not found."));
                
            }

            KafkaFacade.producer.send({
                topic: topic,
                messages: message,
            }).then(metadata => {
                for (const data of metadata) {
                    Logger.debug(`Message successfully produced to topic [${data.topicName}(#${data.partition})].`);
                    Logger.trace(Lang.__("Message produced: "));
                    Logger.trace(message);
                }

                resolve();
            }, error => {
                Logger.error(`Error producing a message to topic [${topic}]`);
                Logger.trace(Lang.__("Message: "));
                Logger.trace(message);
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
            Logger.trace(stream.body);
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
            sessionTimeout: 9000,
            metadataMaxAge: 9000,
            heartbeatInterval: 3000,
            retry: {
                maxRetryTime: 24 * 60 * 60 * 1000,
                factor: 0,
                multiplier: 1,
                retries: 100000,
                initialRetryTime: 1000,
            },
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

export function kafkaLogger(level: logLevel) {
    return (entry: LogEntry): void => {

        switch (level) {
        case logLevel.ERROR:
            logCatchedError({
                name: entry.log.namespace,
                message: JSON.stringify(entry),
                stack: entry.log.stack
            });
            break;

        case logLevel.WARN:
            Logger.warn(entry);
            break;

        case logLevel.INFO:
            Logger.info(entry);
            break;

        case logLevel.DEBUG:
            Logger.audit(entry);
            break;

        default:
            Logger.audit(entry);
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
                logLevel: logLevel.ERROR,
                logCreator: kafkaLogger,
                requestTimeout: 9000,
                connectionTimeout: 9000,
                retry: {
                    maxRetryTime: 24 * 60 * 60 * 1000,
                    factor: 0,
                    multiplier: 1,
                    retries: 100000,
                    initialRetryTime: 1000,
                },
            });

            const admin = kafka.admin();
            KafkaFacade.kafka = kafka;

            await admin.connect()
                .then(async () => {
                    const currentTopics = await admin.listTopics();
                    const topicsArray = getEnv("KAFKA_TOPICS", "default_topic").split(",");
                    Logger.audit(Lang.__("Current topics: " + currentTopics.join(", ")));

                    if (getEnv("KAFKA_CREATE_TOPICS_ON_START", "false") == "true") {
                        if (getEnv("KAFKA_DELETE_TOPICS_ON_START", "false") == "true" && NODE_ENV != "production") {
                            await admin.deleteTopics({
                                topics: topicsArray.filter(topic => currentTopics.includes(topic))
                            });

                            Logger.audit(Lang.__("Topic [{{topic}}] deleted"));
                        }

                        const newTopics: ITopicConfig[] = [];
                        const topicPartitions: ITopicPartitionConfig[] = [];

                        for (const topic of topicsArray) {
                            Logger.audit(Lang.__("Preparing topic [{{topic}}].", {
                                topic: topic
                            }));

                            if (!currentTopics.includes(topic) || false) {
                                Logger.audit(Lang.__("Preparing topic [{{topic}}] creation.", {
                                    topic: topic
                                }));

                                newTopics.push({
                                    topic: topic,
                                    numPartitions: getEnv("KAFKA_NUM_PARTITIONS") ? parseInt(getEnv("KAFKA_NUM_PARTITIONS")) : undefined,
                                    replicationFactor: getEnv("KAFKA_REPLICATION_FACTOR") ? parseInt(getEnv("KAFKA_REPLICATION_FACTOR")) : undefined,
                                });                            
                            } else {
                                const defaultPartitions = parseInt(getEnv("KAFKA_NUM_PARTITIONS", "1"));
                                const metadata = await admin.fetchTopicMetadata({
                                    topics: [topic]
                                });

                                const currentPartitions = metadata.topics[0].partitions.length;

                                Logger.audit(Lang.__("Topic [{{topic}}(#{{partitions}})] already exists.", {
                                    topic: topic,
                                    partitions: currentPartitions.toString()
                                }));

                                if (defaultPartitions > metadata.topics[0].partitions.length) {
                                    Logger.audit(Lang.__("Preparing partition creation [{{partitions}}] for topic [{{topic}}].", {
                                        topic: topic,
                                        partitions: defaultPartitions.toString(),
                                    }));

                                    topicPartitions.push({
                                        topic: topic,
                                        count: defaultPartitions
                                    });
                                }
                            }
                            if (newTopics.length > 0) {
                                await admin.createTopics({
                                    waitForLeaders: true,
                                    topics: newTopics
                                }).then(result => {
                                    if (result) {
                                        Logger.audit(Lang.__("Topics [{{topics}}] successfully created.", {
                                            topics: newTopics.map(item => item.topic).join(", ")
                                        }))
                                    } else {
                                        Logger.audit(Lang.__(`Topics [{{topics}}] were not created.`, {
                                            topics: newTopics.map(item => item.topic).join(", ")
                                        }))
                                    }
                                }, error => {
                                    logCatchedException(error)
                                })
                                    .catch(logCatchedException)
                                ;
                            }

                            if (topicPartitions.length > 0) {
                                await admin.createPartitions({
                                    topicPartitions: topicPartitions
                                }).then(result => {
                                    if (result) {
                                        Logger.audit(Lang.__("Partitions for topics [{{topics}}] successfully created.", {
                                            topics: topicPartitions.map(item => item.topic).join(", ")
                                        }))
                                    } else {
                                        Logger.audit(Lang.__(`Partitions for topics [{{topics}}] were not created.`, {
                                            topics: topicPartitions.map(item => item.topic).join(", ")
                                        }))
                                    }
                                }, error => {
                                    logCatchedException(error)
                                })
                                    .catch(logCatchedException)
                                ;
                            }
                        }
                    }

                    if (this.boostrap.consumers.length > 0) {        
                        Logger.audit(Lang.__("Consumers set up started."));

                        for (const consumerClass of this.boostrap.consumers) {
                            const instance = new consumerClass();
                            instance.onCreated();

                            Logger.audit(Lang.__("Preparing consumer [{{name}}({{group}})] on topic [{{topic}}].", {
                                name: instance.constructor.name,
                                group: instance.groupId,
                                topic: instance.topic,
                            }));

                            const consumer = await KafkaFacade.getConsumer(instance.groupId).catch(logCatchedError) as Consumer;

                            await instance.boot(consumer).then(() => {
                                consumer.run({
                                    autoCommit: true,
                                    autoCommitInterval: 3000,
                                    autoCommitThreshold: 100,
                                    eachMessage: async payload => {
                                        const heartbeat = () => {
                                            clearTimeout(heartbeatTimeout);

                                            return setTimeout(async () => {
                                                await payload.heartbeat();
                                                heartbeat();
                                            }, 3000);
                                        }

                                        const heartbeatTimeout = heartbeat();

                                        const message = payload.message;
                                        const value = JSON.parse(payload.message.value?.toString() as string);

                                        Logger.debug(Lang.__("Consuming message on [{{name}}({{group}})] from topic [{{topic}}(#{{partition}})]", {
                                            name: instance.constructor.name,
                                            group: instance.groupId,
                                            topic: instance.topic,
                                            partition: payload.partition.toString(),
                                        }))

                                        return instance.handler(value, payload)
                                            .then(() => {
                                                Logger.debug(Lang.__("Message successfully consumed on [{{name}}({{group}})] from topic [{{topic}}(#{{partition}})]", {
                                                    name: instance.constructor.name,
                                                    group: instance.groupId,
                                                    topic: instance.topic,
                                                    partition: payload.partition.toString(),
                                                }))
                                                Logger.trace(Lang.__("Message consumed: "));
                                                Logger.trace({
                                                    key: message.key?.toString(),
                                                    offset: message.offset,
                                                    message: message.value?.toString(),
                                                    headers: message.headers,
                                                    timestamp: moment(message.timestamp, "x").format(TIMESTAMP_FORMAT),
                                                });
                        
                                                instance.onCompleted(message);
                                            }, error => {
                                                logCatchedError(error);
                                                instance.onFailed(error, message);
                                            })
                                            .catch(error => {
                                                instance.onError(error);
                                                logCatchedError(error);
                                            }).finally(() => {
                                                clearTimeout(heartbeatTimeout);
                                            })
                                        ;
                                    }
                                });

                                Logger.audit(Lang.__("Consumer [{{name}}({{group}})] on topic [{{topic}}] is ready.", {
                                    name: instance.constructor.name,
                                    group: instance.groupId,
                                    topic: instance.topic,
                                }))
                            });

                            instance.onBooted();
                        }

                        Logger.audit(Lang.__("Consumers set up completed [{{count}}].", {
                            count: this.boostrap.consumers.length.toString()
                        }));
                    } else {
                        Logger.audit(Lang.__("No consumers found."));
                    }

                    const producer = kafka.producer({
                        allowAutoTopicCreation: false,
                        transactionTimeout: 2000,
                        metadataMaxAge: 9000,
                        retry: {
                            maxRetryTime: 24 * 60 * 60 * 1000,
                            factor: 0,
                            multiplier: 1,
                            retries: 100000,
                            initialRetryTime: 1000,
                        },
                    });
        
                    await producer.connect().then(async () => {
                        KafkaFacade.producer = producer;
        
                        Logger.debug(Lang.__("Kafka producer successfully connected to kafka broker(s) on [{{brokers}}].", {
                            brokers: brokers
                        }));
        
                        resolve();
                    }, error => {
                        Logger.error(`Kafka producer cannot connect to kafka broker(s) [${brokers}].`);
                        logCatchedException(error);
                        reject(error);
                    })
                        .catch(logCatchedException)
                    ;
                })
            ;
            resolve();
        });
    }
}
