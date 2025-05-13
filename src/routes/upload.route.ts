import { Router } from "express";
import { Request, Response } from "express";
import { configureUpload } from "../utils/fileUpload";

const upload = configureUpload();
const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), (req: Request, res: Response) => {
  console.log("post uload data");
  if (!req.file) {
    return res.status(400).json({ error: "File upload failed" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  console.log("fileurl", fileUrl);
  return res.json({ fileUrl });
});

export default uploadRouter;
