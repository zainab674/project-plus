import multer from "multer";

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).single("file");

const multipleUpload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 10
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Word, text, and image files are allowed.'), false);
        }
    }
}).fields([
    { name: "files", maxCount: 10 },
    { name: "file", maxCount: 10 },
    { name: "file_0", maxCount: 1 },
    { name: "file_1", maxCount: 1 },
    { name: "file_2", maxCount: 1 },
    { name: "file_3", maxCount: 1 },
    { name: "file_4", maxCount: 1 },
    { name: "file_5", maxCount: 1 },
    { name: "file_6", maxCount: 1 },
    { name: "file_7", maxCount: 1 },
    { name: "file_8", maxCount: 1 },
    { name: "file_9", maxCount: 1 },
    { name: "document1", maxCount: 1 },
    { name: "document2", maxCount: 1 }
]);

export default singleUpload;
export { multipleUpload };