import { produceTranscribtion } from './kafkaService.js';
import {prisma} from "../prisma/index.js";

export const handleTranscibtion = async (transcribe,config) => {
    const message = {
        transcribe: transcribe.text,
        meeting_id: config.meeting_id,
        user_id: parseInt(config.user_id),
        created_at: new Date(Date.now())
    }

    produceTranscribtion(message);
}




export const handleDisconnted = async (config,redis) => {
   let participantsCount = await redis.get(config.meeting_id);
   participantsCount = parseInt(participantsCount);
   console.log(participantsCount);
   if(participantsCount == 1){
        let starttime = await redis.get(`${config.meeting_id}-starttime`);
        
        if(starttime){
            starttime = parseInt(starttime);
            const endtime = Date.now();
            const duration = ((endtime-starttime)/1000)/60;
            handleUpdateStatus(config.meeting_id,"COMPLETED",null,new Date(endtime),duration);
        }


        //delete all value after meeting end
        await redis.del(`${config.meeting_id}-starttime`);
        await redis.del(config.meeting_id);
        return
   }

   await redis.set(config.meeting_id,participantsCount-1);
}



export const handleUpdateStatus = async (meeting_id,status,starttime,endtime,duration) => {
    const data = {};
    if(status){
        data["status"] = status;
        data["isScheduled"] = false;
    }
    if(starttime){
        data["start_time"] = starttime;
    }
    if(endtime){
        data["end_time"] = endtime;
    }
    if(duration){
        data["duration"] = duration;
    }


    try {
        await prisma.meeting.update({
            where: {
                meeting_id
            },
            data: data
        });
    } catch (error) {
        console.log(`Getting an error while update status: ${error.message}`);
    }
}



export const addParticipant = async (meeting_id,user_id) => {
    try {
        const participant = await prisma.meetingParticipant.findFirst({
            where: {
                meeting_id,
                user_id: parseInt(user_id)
            }
        });

        if(!participant){
            await prisma.meetingParticipant.create({
                data: {
                    meeting_id,
                    user_id: parseInt(user_id)
                }
            });
        }

    } catch (error) {
        console.log(`Getting an error while add participants: ${error.message}`);
    }
}



export const addTranscibtion = async (transcibtions) => {
    try {
        await prisma.meetingTranscibtion.createMany({
            data: transcibtions
        });

    } catch (error) {
        console.log(`Getting an error while add participants: ${error.message}`);
    }
}
