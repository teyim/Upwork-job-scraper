"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const node_cron_1 = __importDefault(require("node-cron"));
const scraper_1 = require("./lib/scraper");
const Telegram_1 = require("./lib/Telegram");
node_cron_1.default.schedule(" */2 * * * *", () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Running scheduled job...");
    try {
        yield (0, scraper_1.scrapeData)();
        yield (0, Telegram_1.sendNewJobNotifications)(constants_1.chatId);
        console.log("Scheduled job completed successfully.");
    }
    catch (error) {
        console.error("Error in scheduled job:", error);
    }
}));
