import cloudinary from 'cloudinary';
import {config} from 'dotenv';
import { fileToUri } from '../processors/fileToUriProcessor.js';
config();

const uploadToCloudinary = async (data, mimetype) => {
    try {
           
        if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary configuration is missing. Please check environment variables.');
        }
        
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const res = await cloudinary.v2.uploader.upload(data, {
            resource_type: "auto",
            mimetype
        });

        if (!res || !res.secure_url) {
            throw new Error('Cloudinary upload failed - no secure URL returned');
        }

        return {
            url: res.secure_url,
            key: res.public_id
        };
    } catch (error) {
        
        // Handle different types of Cloudinary errors
        let errorMessage = 'Unknown Cloudinary error';
        
        if (error.message) {
            errorMessage = error.message;
        } else if (error.error) {
            errorMessage = error.error.message || error.error.toString();
        } else if (error.http_code) {
            errorMessage = `HTTP ${error.http_code}: ${error.error?.message || 'Upload failed'}`;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
            // Try to extract meaningful information from the error object
            errorMessage = JSON.stringify(error);
        }
        
        throw new Error(`Cloudinary upload failed: ${errorMessage}`);
    }
}

export const uploadToCloud = async (file) => {
    try {
          
        
        if (!file || !file.buffer || !file.originalname) {
            throw new Error('Invalid file object provided');
        }
        
        // Check file size (Cloudinary has limits)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (100MB)`);
        }
        
        // Check if file has content
        if (file.buffer.length === 0) {
            throw new Error('File appears to be empty');
        }
        
        const fileUri = fileToUri(file);
        if (!fileUri || !fileUri.content) {
            throw new Error('Failed to convert file to URI');
        }
        
        const cloudRes = await uploadToCloudinary(fileUri.content, file.mimetype);
        if (!cloudRes || !cloudRes.url) {
            throw new Error('Cloudinary upload failed - no URL returned');
        }
        
        return cloudRes;
    } catch (error) {
        throw new Error(`File upload failed: ${error.message || error.toString()}`);
    }
}