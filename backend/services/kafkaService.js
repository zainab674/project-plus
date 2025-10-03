// import { Kafka, Partitioners } from "kafkajs";
// import dotenv from "dotenv";
// import fs from "fs";
// import path from "path";
// import { addTranscibtion } from "./transcriveService.js";
// import { addChatMessage } from "./chatService.js";
// dotenv.config();
// const __dirname = path.resolve();

// const kafka = new Kafka({

//     clientId: 'api-service',
//     brokers: [process.env.KAFKA_BROKER],
//     ssl: {
//         ca: [fs.readFileSync(path.join(__dirname, 'ca.pem'), 'utf-8')],
//         cert: fs.readFileSync(path.join(__dirname, 'service.cert'), 'utf-8'),
//         key: fs.readFileSync(path.join(__dirname, 'service.key'), 'utf-8'),
//         rejectUnauthorized: true
//     },
//     // sasl: {
//     //     username: process.env.KAFKA_USER,
//     //     password: process.env.KAFKA_PASS,
//     //     mechanism: 'plain'
//     // }

//     sasl: undefined
// });

// let transcibtionProducer = null;
// let chatProducer = null;


// let transcibtionConsumer = null;
// let chatConsumer = null;


// //transcibtion array
// let transcriptions = [];
// let chatMessages = [];


// export const ensureTopicsExist = async () => {
//     const admin = kafka.admin();
//     await admin.connect();
//     await admin.createTopics({
//         topics: [
//             { topic: 'transcribtion', numPartitions: 1, replicationFactor: 1 },
//             { topic: 'chat', numPartitions: 1, replicationFactor: 1 },
//         ],
//         waitForLeaders: true
//     });
//     await admin.disconnect();
// };





// export const getProducer = async () => {
//     if (transcibtionProducer) return transcibtionProducer;
//     transcibtionProducer = kafka.producer({
//         createPartitioner: Partitioners.LegacyPartitioner
//     });
//     await transcibtionProducer.connect();
//     return transcibtionProducer;
// }


// export const produceTranscribtion = async (message) => {
//     const producer = await getProducer();
//     await producer.send({ topic: "transcribtion", messages: [{ key: "transcribtion", value: JSON.stringify(message) }] });
// }


// export const produceChat = async (message) => {
//     const producer = await getProducer();
//     await producer.send({ topic: "chat", messages: [{ key: "chat", value: JSON.stringify(message) }] });
// }


// export const initTransciptConsumer = async () => {
//     if (transcibtionConsumer) return;
//     transcibtionConsumer = kafka.consumer({ groupId: "transcript-consumer" });
//     transcibtionConsumer.connect();
//     transcibtionConsumer.subscribe({ topics: ["transcribtion"] });

//     await transcibtionConsumer.run({
//         eachBatch: async ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) => {
//             const messages = batch.messages;
//             for (const message of messages) {
//                 const messageValue = message.value.toString();
//                 const value = JSON.parse(messageValue);
//                 transcriptions.push(value);
//             }
//         }
//     })
// }




// export const initChatConsumer = async () => {
//     if (chatConsumer) return;
//     chatConsumer = kafka.consumer({ groupId: "chat-consumer" });
//     chatConsumer.connect();
//     chatConsumer.subscribe({ topics: ["chat"] });

//     await chatConsumer.run({
//         eachBatch: async ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) => {
//             const messages = batch.messages;
//             for (const message of messages) {
//                 if (message.value) {
//                     const messageValue = message.value.toString();
//                     const value = JSON.parse(messageValue);
//                     chatMessages.push(value);
//                 }
//             }
//         }
//     })
// }


// export const flushTranscribtion = async () => {
//     if (transcriptions.length != 0) {
//         const transcibtionsCopy = [...transcriptions];
//         transcriptions.length = 0;
//         await addTranscibtion(transcibtionsCopy);
//     }


//     if (chatMessages.length != 0) {
//         const messagesCopy = [...chatMessages];
//         chatMessages.length = 0;
//         await addChatMessage(messagesCopy);
//     }


// }

// //flush
// let intervalRef = setInterval(flushTranscribtion, 10000);



import { Kafka, Partitioners } from "kafkajs";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { addTranscibtion } from "./transcriveService.js";
import { addChatMessage } from "./chatService.js";
dotenv.config();
const __dirname = path.resolve();

const kafka = new Kafka({

    clientId: 'api-service',
    brokers: [process.env.KAFKA_BROKER],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'ca.pem'), 'utf-8')],
        cert: fs.readFileSync(path.join(__dirname, 'service.cert'), 'utf-8'),
        key: fs.readFileSync(path.join(__dirname, 'service.key'), 'utf-8'),
        rejectUnauthorized: true
    },
    // sasl: {
    //     username: process.env.KAFKA_USER,
    //     password: process.env.KAFKA_PASS,
    //     mechanism: 'plain'
    // }

    sasl: undefined
});

let transcibtionProducer = null;
let chatProducer = null;


let transcibtionConsumer = null;
let chatConsumer = null;


//transcibtion array
let transcriptions = [];
let chatMessages = [];


export const ensureTopicsExist = async () => {
    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
        topics: [
            { topic: 'transcribtion', numPartitions: 1, replicationFactor: 1 },
            { topic: 'chat', numPartitions: 1, replicationFactor: 1 },
        ],
        waitForLeaders: true
    });
    await admin.disconnect();
};





export const getProducer = async () => {
    if (transcibtionProducer) return transcibtionProducer;
    transcibtionProducer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner
    });
    await transcibtionProducer.connect();
    return transcibtionProducer;
}


export const produceTranscribtion = async (message) => {
    const producer = await getProducer();
    await producer.send({ topic: "transcribtion", messages: [{ key: "transcribtion", value: JSON.stringify(message) }] });
}


export const produceChat = async (message) => {
    const producer = await getProducer();
    await producer.send({ topic: "chat", messages: [{ key: "chat", value: JSON.stringify(message) }] });
}


export const initTransciptConsumer = async () => {
    if (transcibtionConsumer) return;
    transcibtionConsumer = kafka.consumer({ groupId: "transcript-consumer" });
    transcibtionConsumer.connect();
    transcibtionConsumer.subscribe({ topics: ["transcribtion"] });

    await transcibtionConsumer.run({
        eachBatch: async ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) => {
            const messages = batch.messages;
            for (const message of messages) {
                const messageValue = message.value.toString();
                const value = JSON.parse(messageValue);
                transcriptions.push(value);
            }
        }
    })
}




export const initChatConsumer = async () => {
    if (chatConsumer) return;
    chatConsumer = kafka.consumer({ groupId: "chat-consumer" });
    chatConsumer.connect();
    chatConsumer.subscribe({ topics: ["chat"] });

    await chatConsumer.run({
        eachBatch: async ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset }) => {
            const messages = batch.messages;
            for (const message of messages) {
                if (message.value) {
                    const messageValue = message.value.toString();
                    const value = JSON.parse(messageValue);
                    chatMessages.push(value);
                }
            }
        }
    })
}


export const flushTranscribtion = async () => {
    if (transcriptions.length != 0) {
        const transcibtionsCopy = [...transcriptions];
        transcriptions.length = 0;
        await addTranscibtion(transcibtionsCopy);
    }


    if (chatMessages.length != 0) {
        const messagesCopy = [...chatMessages];
        chatMessages.length = 0;
        await addChatMessage(messagesCopy);
    }


}

//flush
let intervalRef = setInterval(flushTranscribtion, 10000);