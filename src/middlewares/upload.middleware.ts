import multer from "multer";

const storage = multer.memoryStorage(); // buffer in memory for Cloudinary
export const upload = multer({ storage });