import { SESClient } from "@aws-sdk/client-ses";
import { config } from "dotenv";

config();

const accessKey = process.env.AWS_SES_ACCESS_KEY_ID!;
const secretKey = process.env.AWS_SES_SECRET_ACCESS_KEY!;
const region = process.env.AWS_SES_DEFAULT_REGION!;

export const SES = new SESClient({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  region: region,
});

// might use this