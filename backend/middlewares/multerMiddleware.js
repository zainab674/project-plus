import multer from "multer";

const storage = multer.memoryStorage();

const singleUpload = multer({ storage }).single("file");
const multipleUpload = multer({ storage }).fields([
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
    { name: "file_9", maxCount: 1 }
]);

export default singleUpload;
export { multipleUpload };