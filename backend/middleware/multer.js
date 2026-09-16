import multer from "multer";

// ✅ Memory storage - stores file as buffer for Cloudinary upload
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;