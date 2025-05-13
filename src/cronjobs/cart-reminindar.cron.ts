import cron from "node-cron";
import { sendDailyCartReminders } from "../utils/emails";

//  Run every day at 9 AM
export function startCartReminderCronJob() {
  // Schedule to run every 4 hours at the top of the hour (00:00, 04:00, 08:00, etc.)
  cron.schedule(
    "0 */4 * * *", // Every 4 hours at minute 0
    async () => {
      console.log("Running daily cart reminder job...");
      try {
        await sendDailyCartReminders();
        console.log("Cart reminders sent successfully");
      } catch (error) {
        console.error("Failed to send cart reminders:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Karachi", // Set to Pakistan timezone
    }
  );

  console.log("Cart reminder cron job started");
}
