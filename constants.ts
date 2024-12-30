import "dotenv/config";

const { TOKEN, SERVER_URL } = process.env;
export const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
export const URI = `/webhook/${TOKEN}`;
export const WEBHOOK_URL = SERVER_URL;

export const databaseUrl = process.env.MONGO_URI || "";
export const chatId = process.env.CHAT_ID || "";

export const DB_NAME = "upwork";
export const DB_COLLECTION = "jobs";
