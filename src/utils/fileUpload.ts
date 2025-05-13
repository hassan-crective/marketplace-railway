import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const UPLOADS_FOLDER = path.join(__dirname, "/uploads");

if (!fs.existsSync(UPLOADS_FOLDER)) {
  fs.mkdirSync(UPLOADS_FOLDER, { recursive: true });
  console.log(`Uploads folder created at: ${UPLOADS_FOLDER}`);
}

export const configureUpload = () => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_FOLDER);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
  });

  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv/;
    const extName = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedFileTypes.test(file.mimetype);

    if (extName && mimeType) {
      cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png, gif) and documents (pdf, doc, docx, txt) are allowed!"));
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  });
};
