import { TransactionalEmailsApi, SendSmtpEmail } from "@getbrevo/brevo";
import dotenv from "dotenv";
import { EmailOptions } from "../interfaces/email.interfaces";


dotenv.config();

// Initialize Brevo client
const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY || "");

const SENDER_EMAIL = process.env.SENDER_EMAIL || "default@example.com";
const SENDER_NAME = process.env.SENDER_NAME || "Crective";

/**
 * Send an email using Brevo (formerly SendinBlue)
 * @param options Email options
 * @returns Promise with API response
 * @throws Error if email sending fails
 */
export const sendBrevoEmail = async ({
  toEmail,
  toName,
  subject,
  htmlContent,
  text,
  attachments,
  from,
}: EmailOptions): Promise<any> => {
  // Validate required fields
  if (!toEmail || !subject) {
    throw new Error("toEmail and subject are required");
  }

  // Convert attachments to Brevo format if they exist
  const brevoAttachments = attachments?.map((attachment) => ({
    name: attachment.filename,
    content: attachment.content.toString("base64"),
    contentType: attachment.contentType || "application/octet-stream",
  }));

  // Create email payload
  const sendSmtpEmail: SendSmtpEmail = {
    sender: { email: from || SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: toEmail, name: toName || " ((default))" }],
    subject,
    htmlContent: htmlContent || "",
    textContent: text || (htmlContent ? htmlContent.replace(/<[^>]*>?/gm, "") : ""),
    attachment: brevoAttachments,
  };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully:", response);
    return response;
  } catch (error: any) {
    console.error("Failed to send email:", error);
    throw new Error(error.response?.body?.message || error.message || "Failed to send email");
  }
};
