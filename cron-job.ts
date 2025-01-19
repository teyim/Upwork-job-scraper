import { chatId } from "./constants";
import cron from "node-cron";
import { scrapeData } from "./lib/scraper";
import { sendNewJobNotifications } from "./lib/Telegram";

cron.schedule(" * * * * *", async () => {
  console.log("Running scheduled job...");

  try {
    await scrapeData();

    await sendNewJobNotifications(chatId);

    console.log("Scheduled job completed successfully.");
  } catch (error) {
    console.error("Error in scheduled job:", error);
  }
});
