import { getCollection, markJobsAsSent } from "../dbHelpers";
import { Collection } from "mongodb";
import { getNewJobsForTelegram } from "../dbHelpers";
import { JobPost } from "../types";
import { axiosInstance } from "./axios";
import { createJobMessage } from "../utils";
import { DB_COLLECTION, TELEGRAM_API } from "../constants";

async function sendSequentialMessages(
  collection: Collection<JobPost>,
  chatId: string,
  jobs: JobPost[],
  delayMs: number
) {
  try {
    for (const job of jobs) {
      const { text, parse_mode, reply_markup } = createJobMessage(job);

      await axiosInstance.post("sendMessage", {
        chat_id: chatId,
        text: text,
        parse_mode: parse_mode,
        reply_markup: reply_markup,
      });
      // Add delay between requests to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    console.log("All jobs sent successfully!");
  } catch (error) {
    console.error("Error sending jobs to Telegram:", error);
  }
}

export async function sendNewJobNotifications(chatId: string) {
  try {
    const collection = await getCollection(DB_COLLECTION);

    const newJobs = await getNewJobsForTelegram(collection);

    const jobsToSend = newJobs.slice(0, 10); // prevent telegram server error for long job list

    await sendSequentialMessages(collection, chatId, jobsToSend, 2);

    const NewJobIds = jobsToSend.map((newJob) => newJob.jobId);

    await markJobsAsSent(collection, NewJobIds);
  } catch (error) {
    console.error("Error sending Telegram notifications:", error);
  }
}

//handle incoming messages and send response
export async function handleTelegramMessage(body: any): Promise<string> {
  if (body?.message?.chat?.id) {
    const chatId = body.message.chat.id;
    const messageText = body.message.text;

    try {
      await axiosInstance.post(`sendMessage`, {
        chat_id: chatId,
        text: `Your Chat ID is -- ${chatId}`,
      });

      console.log(`Message sent to Chat ID: ${chatId}, Text: ${messageText}`);
      return "Message processed successfully";
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }

  throw new Error("Invalid request: No chat ID found");
}
