import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accessKey = process.env.AWS_ACCESS_KEY_ID!;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY!;
const region = process.env.AWS_DEFAULT_REGION!;

export const S3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: region,
});

// most likely won't use this