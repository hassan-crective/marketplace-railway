// HTML version
export const generateCartReminderHtml = (
  name: string,
  cartItems: {
    siteName: string;
    price: number;
    adjustedPrice: number;
    websiteUrl: string;
  }[],
  totalAmount: number
): string => {
  const itemsHtml = cartItems
    .map((item, index) => {
      const savings = item.price - item.adjustedPrice;
      const hasSavings = savings > 0;
      const priceIncreased = savings < 0;
      const savingsText = hasSavings
        ? `(Save $${savings.toFixed(2)})`
        : priceIncreased
        ? `(Price increased by $${Math.abs(savings).toFixed(2)})`
        : "";
      const priceColor = hasSavings ? "#28a745" : priceIncreased ? "#dc3545" : "#2c3e50";

      return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea;">
          <div style="margin-bottom: 6px; font-size: 16px; font-weight: 600; color: #333;">
            ${index + 1}. ${item.siteName}
          </div>
          <div style="margin-bottom: 4px; font-size: 14px; color: #666;">
            <span style="display: inline-block; width: 100px;">Original:</span>
            <span style="text-decoration: line-through;">$${item.price.toFixed(2)}</span>
          </div>
          <div style="margin-bottom: 8px; font-size: 14px;">
            <span style="display: inline-block; width: 100px; color: #666;">Your Price:</span>
            <span style="color: ${priceColor}; font-weight: 500;">$${item.adjustedPrice.toFixed(2)}</span>
            ${savingsText ? `<span style="color: ${priceColor}; font-size: 13px;"> ${savingsText}</span>` : ""}
          </div>
          <div style="margin-top: 8px;">
            <a href="${item.websiteUrl}" 
               style="color: #0066cc; text-decoration: none; font-size: 13px;">
              ▶ View Item
            </a>
          </div>
        </td>
      </tr>`;
    })
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      <h2 style="color: #333333; font-size: 22px; margin-bottom: 5px;">Your Cart Items Are Waiting!</h2>
      <p style="color: #666666; font-size: 15px; margin-bottom: 25px;">Complete your purchase before they're gone</p>
      
      <p style="color: #333333; font-size: 15px; margin-bottom: 5px;">Dear ${name || "Customer"},</p>
      <p style="color: #666666; font-size: 15px; margin-bottom: 20px; line-height: 1.5;">
        You still have items waiting in your cart. Here's your summary:
      </p>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        ${itemsHtml}
      </table>
      
      <div style="background-color: #f7f7f7; padding: 15px; border-radius: 6px; margin-bottom: 25px;">
        <div style="text-align: right;">
          <span style="font-size: 16px; color: #666;">Total Amount:</span>
          <span style="font-size: 20px; font-weight: 600; color: #333; margin-left: 10px;">$${totalAmount.toFixed(
            2
          )}</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}" 
           style="display: inline-block; background-color: #0066cc; color: #ffffff; 
                  padding: 12px 25px; text-decoration: none; border-radius: 4px; 
                  font-weight: 500; font-size: 16px;">
          Complete Purchase Now
        </a>
      </div>
      
      <p style="color: #999999; font-size: 14px; line-height: 1.5; margin-bottom: 25px;">
        If you've already completed your purchase, please ignore this email.
      </p>
      
      <div style="border-top: 1px solid #eeeeee; padding-top: 20px;">
        <p style="color: #666666; font-size: 14px; margin-bottom: 5px;">
          Need help or have questions? Contact us at 
          <a href="mailto:${process.env.SENDER_EMAIL}" style="color: #0066cc; text-decoration: none;">
            ${process.env.SENDER_EMAIL}
          </a>
        </p>
        <p style="color: #666666; font-size: 14px; margin-top: 15px;">
          Best regards,<br>
          <strong>German Guest Post</strong>
        </p>
      </div>
      
      <p style="color: #aaaaaa; font-size: 12px; text-align: center; margin-top: 30px;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>`;
};

// Plain text version
export const generateCartReminderText = (
  name: string,
  cartItems: {
    siteName: string;
    price: number;
    adjustedPrice: number;
    websiteUrl: string;
  }[],
  totalAmount: number
): string => {
  const itemsText = cartItems
    .map((item, index) => {
      const savings = item.price - item.adjustedPrice;
      const savingsText =
        savings > 0
          ? `(Save $${savings.toFixed(2)})`
          : savings < 0
          ? `(Price increased by $${Math.abs(savings).toFixed(2)})`
          : "";

      return `
${index + 1}. ${item.siteName}
   Original Price:    $${item.price.toFixed(2)}
   Your Price:        $${item.adjustedPrice.toFixed(2)} ${savingsText}
   View Item:         ${item.websiteUrl}`;
    })
    .join("\n\n");

  return `
Dear ${name || "Customer"},

You still have items waiting in your cart! Here's your summary:

${itemsText}

-----------------------------------------
TOTAL AMOUNT:      $${totalAmount.toFixed(2)}
-----------------------------------------

Complete your purchase now:
${process.env.FRONTEND_URL}

If you've already completed your purchase, please ignore this message.

For any questions or assistance, please contact us at:
${process.env.SENDER_EMAIL}

Best regards,
German Guest Post

[This is an automated message]`;
};
