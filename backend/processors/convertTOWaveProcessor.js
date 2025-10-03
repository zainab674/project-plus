import WaveFile from 'wavefile'


export const convertToWave = async (buffer) => {
    try {
        const wav = new WaveFile.WaveFile(buffer);
        return wav.toBuffer();
    } catch (error) {
        return buffer;
    }
}