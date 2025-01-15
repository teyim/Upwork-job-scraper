import express, { Request, Response, text } from "express";
import axios from "axios";
import "dotenv/config";
import { TELEGRAM_API, WEBHOOK_URL } from "./constants";
import { handleTelegramMessage } from "./lib/Telegram";
// import "./cron-job";

const app = express();
app.use(express.json());

const init = async () => {
  const clearCache = await axios.get(
    `${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`
  );
  console.log(clearCache.data);
  const response = await axios.get(
    `${TELEGRAM_API}/setwebhook?url=${WEBHOOK_URL}`
  );
  console.log(response.data);
};

app.post("*", async (req: Request, res: Response) => {
  try {
    const result = await handleTelegramMessage(req.body);
    res.status(200).send(result);
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

app.get("*", async (req: Request, res: Response) => {
  res.send("App up and running");
  return;
});

app.listen(process.env.port || 5000, async () => {
  console.log("app is running on port", process.env.port || 5000);
  await init();
});
