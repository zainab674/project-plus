import cloudinary from 'cloudinary';
import {config} from 'dotenv';
import { fileToUri } from '../processors/fileToUriProcessor.js';
config();



const uploadToCloudinary = async (data,mimetype) => {
   
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

   
    const res = await cloudinary.v2.uploader.upload(data,{
        resource_type: "auto",
        mimetype
      });

    return {
        url: res.secure_url,
        key: res.public_id
    }
    
}



export const uploadToCloud = async (file) => {
    const fileUri = fileToUri(file);
    const cloudRes = await uploadToCloudinary(fileUri.content,file.mimetype);
    return cloudRes;
}