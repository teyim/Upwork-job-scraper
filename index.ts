import express, { Request, Response } from "express";
import axios from "axios";
import "dotenv/config";
import { TELEGRAM_API, WEBHOOK_URL } from "./constants";
import { handler } from "./lib";
import "./cron-job";

const app = express();
app.use(express.json());

const init = async () => {
  const response = await axios.get(
    `${TELEGRAM_API}/setwebhook?url=${WEBHOOK_URL}`
  );
  console.log(response.data);
};

app.post("*", async (req: Request, res: Response) => {
  res.send(await handler(req));
  return;
});

app.get("*", async (req: Request, res: Response) => {
  res.send(await handler(req));
  return;
});

app.listen(process.env.port || 5000, async () => {
  console.log("app is running on port", process.env.port || 5000);
  await init();
});
