import { config } from "dotenv";
import { Redis } from "ioredis";
import { ON_DISCONNET, ON_TRANSCRIPT } from "../constants/transcribeEventConstant.js";
import { addParticipant, handleDisconnted, handleTranscibtion, handleUpdateStatus } from "../services/transcriveService.js";
import { initTransciptConsumer } from "../services/kafkaService.js";

config();

const initTranscribeServer = (io) => {
  const REDIS_SERVER_URL = process.env.REDIS_URL;
  if (!REDIS_SERVER_URL) {
    throw new Error("REDIS_URL environment variable is not set");
  }

  const redis = new Redis(REDIS_SERVER_URL);
  initTransciptConsumer();


  io.on("connection", async (socket) => {
    const config = socket.handshake.query;
    if(!config.user_id || !config.meeting_id){
      socket.disconnect();
      return;
    }

    //check user cound is redis if is 0 then se meetinf status proceessing else increate count
    let participantsCount = await redis.get(config.meeting_id);

    if(!participantsCount){
      //update staus of meeting here
      handleUpdateStatus(config.meeting_id,"PROCESSING",new Date(Date.now()));
      await redis.set(config.meeting_id,1);
      await redis.set(`${config.meeting_id}-starttime`,Date.now());
    }else{
      participantsCount = parseInt(participantsCount);
      await redis.set(config.meeting_id,participantsCount+1);
    }
    //add user to participant list
    addParticipant(config.meeting_id,config.user_id);
 
    socket.on(ON_TRANSCRIPT,(data) => handleTranscibtion(data,config));
    socket.on(ON_DISCONNET,() => handleDisconnted(config,redis));
  });
};

export default initTranscribeServer;