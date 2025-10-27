import DataUriParser from "datauri/parser.js";
import path from "path";

export const fileToUri = (file) => {
  try {
    if (!file || !file.buffer || !file.originalname) {
      throw new Error('Invalid file object provided to fileToUri');
    }
    
    const parser = new DataUriParser();
    const extName = path.extname(file.originalname).toString();
    
    if (!extName) {
      throw new Error('File has no extension');
    }
    
    const result = parser.format(extName, file.buffer);
    
    if (!result || !result.content) {
      throw new Error('Failed to generate data URI');
    }
    
    return result;
  } catch (error) {
    throw new Error(`File processing failed: ${error.message || error.toString()}`);
  }
};
