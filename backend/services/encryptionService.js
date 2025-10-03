import crypto from 'crypto';


export const encrypt = (text) => {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);  
    const iv = crypto.randomBytes(16); 

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        key: key.toString('hex')
    };
}


export const decrypt = (encryptedData, keyHex, ivHex) => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

