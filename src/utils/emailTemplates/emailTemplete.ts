import { string } from "zod";
import { Others } from "../../enums/others.enum";

export const generateEmailTemplate = (subject: string, message: string, userType: Others.role[] | string): string => {
  return `
    <body style="background-color:#c9e4ea; padding: 20px; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table width="600px" style="background: #FFFFFF; padding: 20px; border-radius: 8px; box-shadow: 0px 4px 10px rgba(0,0,0,0.1);">
              <tr>
                <td align="center">
                  <h2 style="color: #333;">${subject}</h2>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="font-size: 16px; color: #555;">Dear ${userType},</p>
                  <p style="font-size: 16px; color: #555;">${message}</p>
                  <p style="font-size: 16px; color: #555;">
                    If you have any questions or need further assistance, please feel free to contact us.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="font-size: 16px; color: #555;">
                    Best regards,<br>
                    <strong>German Guest Post</strong><br>
                    <a href="mailto:${process.env.SENDER_EMAIL}" style="color: #007BFF; text-decoration: none;">${process.env.SENDER_EMAIL}</a>
                  </p>
                  <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    This is an automated message. Please do not reply directly to this email.<br>
                    To unsubscribe from these notifications, please <a href="mailto:${process.env.SENDER_EMAIL}?subject=Unsubscribe" style="color: #999;">click here</a>.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  `;
};
