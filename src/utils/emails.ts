import dotenv from "dotenv";
import { EmailOptions } from "../interfaces/email.interfaces";
import { generateEmailTemplate } from "./emailTemplates/emailTemplete";
import { sendBrevoEmail } from "./brevo";
import { findUsersWithNonEmptyCarts } from "../services/cart.service";
import { generateCartReminderHtml, generateCartReminderText } from "./emailTemplates/cartRemindar";
import { Others } from "../enums/others.enum";

dotenv.config();

/**
 * Send an email using Brevo
 * @param options Email options containing recipient, subject, and message
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const { toEmail, subject, text, toName, attachments, from } = options;

  if (!toEmail || !subject || !text) {
    throw new Error("Missing required fields: email, subject, message.");
  }

  const htmlContent = generateEmailTemplate(subject, text, "Customer");

  try {
    const info = await sendBrevoEmail({
      from,
      toEmail,
      toName,
      subject,
      htmlContent,
      text,
      attachments: attachments,
    });

    console.log(`✅ Email sent to ${toEmail}. Message ID: ${info.messageId || "N/A"}`);
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export async function sendDailyCartReminders() {
  try {
    const carts = await findUsersWithNonEmptyCarts();

    const usersMap = new Map<
      string,
      {
        user: { id: string; email: string; lastName?: string };
        cartItems: CartReminderEmailOptions["cartItems"];
        totalAmount: number;
      }
    >();

    for (const cart of carts) {
      const { user, products, totalAmount } = cart;
      if (!user || !products?.length) continue;

      let userData = usersMap.get(user.id);
      if (!userData) {
        userData = {
          user,
          cartItems: [],
          totalAmount: 0,
        };
        usersMap.set(user.id, userData);
      }

      for (const product of products) {
        userData.cartItems.push({
          siteName: product.siteName,
          price: Number(product.price), // Convert to number
          adjustedPrice: Number(product.adjustedPrice), // Convert to number
          websiteUrl: product.websiteUrl,
        });
      }

      userData.totalAmount += Number(totalAmount); // Convert to number
    }

    await Promise.all(
      Array.from(usersMap.values()).map(async ({ user, cartItems, totalAmount }) => {
        try {
          const name = user.lastName ?? "there";
          const emailHtml = generateCartReminderHtml(name, cartItems, totalAmount);
          const emailText = generateCartReminderText(name, cartItems, totalAmount);

          await sendEmail({
            toEmail: user.email,
            toName: name,
            subject: "Your Cart Items Are Waiting!",
            text: emailText,
            htmlContent: emailHtml,
          });

          console.log(`Cart reminder sent to ${user.email}`);
        } catch (emailErr) {
          console.error(`Failed to send cart reminder to ${user.email}:`, emailErr);
        }
      })
    );
  } catch (error) {
    console.error("Error sending cart reminders:", error);
    throw error;
  }
}

export const sendAdminEmailForPendingOrder = async (options: EmailOptions, role: Others.role): Promise<void> => {
  const { admins, subject, text, attachments } = options;

  if (!admins || admins.length === 0 || !subject || !text) {
    throw new Error("Missing required fields: admins, subject, or message.");
  }

  const htmlContent = generateEmailTemplate(subject, text, role);

  for (const admin of admins) {
    try {
      const info = await sendBrevoEmail({
        toEmail: admin.email,
        subject,
        htmlContent,
        text,
        attachments,
      });

      console.log(`✅ Email sent to ${admin.email}. Message ID: ${info.messageId || "N/A"}`);
    } catch (error: any) {
      console.error(`❌ Failed to send email to ${admin.email}: ${error.message}`);
    }
  }
};
