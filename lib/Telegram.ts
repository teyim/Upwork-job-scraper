import { getCollection, markJobsAsSentAndDelete } from "../dbHelpers";
import { Collection } from "mongodb";
import { getNewJobsForTelegram } from "../dbHelpers";
import { JobPost } from "../types";
import { axiosInstance } from "./axios";
import { createJobMessage } from "../utils";
import { DB_COLLECTION } from "../constants";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendSequentialMessages(
  chatId: string,
  jobs: JobPost[],
  delayMs: number
) {
  for (const job of jobs) {
    const { text, parse_mode, reply_markup } = createJobMessage(job);
    try {
      const response = await axiosInstance.post("sendMessage", {
        chat_id: chatId,
        text: text,
        parse_mode: parse_mode,
        reply_markup: reply_markup,
      });
      console.log("Response:", response.data);
      // Process the response as needed
    } catch (error) {
      console.error("Error:", error);
      // Handle the error as needed
    }
    await delay(delayMs); // Wait for the specified delay before the next iteration
  }
}

export async function sendNewJobNotifications(chatId: string) {
  try {
    const collection = await getCollection(DB_COLLECTION);

    const newJobs = await getNewJobsForTelegram(collection);

    console.log(newJobs[0]);

    await sendSequentialMessages(chatId, newJobs, 2);

    const jobUrls = newJobs.map((job) => job.url);
    await markJobsAsSentAndDelete(collection, jobUrls);

    return;
  } catch (error) {
    console.error("Error sending Telegram notifications:", error);
  }
}
