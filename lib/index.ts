import { Request } from "express";
import { sendNewJobNotifications } from "./Telegram";

export async function handler(req: Request) {
  const { body } = req;

  if (body) {
    const chatId = body.message.chat.id;
    const messageText = body.message.text;

    console.log(chatId);
    await sendNewJobNotifications(chatId);
  }
  return;
}
