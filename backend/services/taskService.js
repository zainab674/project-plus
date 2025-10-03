import { createClient } from "@deepgram/sdk";
import { convertToWave } from "../processors/convertTOWaveProcessor.js";



export const transcribeFile = async (buffer) => {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    const waveBuffer = await convertToWave(buffer);
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        waveBuffer,
      {
        model: "nova-2",
      }
    );
    if(error) return 'Getting an Error During Transcribtion';
    return result?.results?.channels[0]?.alternatives[0]?.transcript
  } catch (error) {
    return error.message;
  }
}
