import { Others } from "../enums/others.enum";
import { sendEmail } from "./emails";
/**
* Send an email notification for an order status change
* @param orderNumber The order number
* @param newStatus The updated status
* @param recipientEmail The email address of the recipient
* @param additionalInfo Additional information (rejection reason, submission details, etc.)
*/
export const sendOrderStatusNotification = async (
  orderNumber: number,
  newStatus: Others.orderStatus,
  recipientEmail: string,
  additionalInfo: {
    rejectionReason?: string;
    submissionDetails?: string;
    submissionUrl?: string;
  } = {}
): Promise<void> => {
  // Prepare appropriate message based on the new status
  let subject = "";
  let message = "";
  switch (newStatus) {
    case Others.orderStatus.PENDING:
      subject = "Your Order Status Has Been Updated to Pending";
      message = `Your Order #${orderNumber} has been set to Pending status.`;
      break;
    case Others.orderStatus.APPROVED:
      subject = "Your Order Has Been Approved!";
      message = `Your Order #${orderNumber} has been approved by the publisher.`;
      break;
    case Others.orderStatus.REJECTED:
      subject = "Your Order Has Been Rejected";
      message = `Your Order #${orderNumber} has been rejected.${additionalInfo.rejectionReason ? ` Reason: ${additionalInfo.rejectionReason}` : ''}`;
      break;
    case Others.orderStatus.INPROGRESS:
      subject = "Your Order is Now In Progress";
      message = `Your Order #${orderNumber} is now being worked on by the publisher.`;
      break;
    case Others.orderStatus.COMPLETED:
      subject = "Your Order is Now Complete";
      message = `Your Order #${orderNumber} has been completed successfully.`;
      break;
    case Others.orderStatus.SUBMITTED:
      subject = "Your Order Has Been Submitted";
      message = `Your Order #${orderNumber} has been submitted.`;
      if (additionalInfo.submissionDetails) {
        message += `\n\nSubmission Details: ${additionalInfo.submissionDetails}`;
      }
      if (additionalInfo.submissionUrl) {
        message += `\n\nSubmission URL: ${additionalInfo.submissionUrl}`;
      }
      break;
    case Others.orderStatus.UNPAID:
      subject = "Payment Required for Your Order";
      message = `Your Order #${orderNumber} is currently unpaid. Please complete payment to continue processing.`;
      break;
    default:
      subject = "Your Order Status Has Been Updated";
      message = `Your Order #${orderNumber} status has been updated to ${newStatus}.`;
  }
  // Send notification email
  await sendEmail({
    toEmail: recipientEmail,
    subject: subject,
    text: message,
  });
};