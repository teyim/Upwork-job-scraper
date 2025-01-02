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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewJobNotifications = sendNewJobNotifications;
const dbHelpers_1 = require("../dbHelpers");
const dbHelpers_2 = require("../dbHelpers");
const axios_1 = require("./axios");
const utils_1 = require("../utils");
const constants_1 = require("../constants");
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function sendSequentialMessages(chatId, jobs, delayMs) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const job of jobs) {
            const { text, parse_mode, reply_markup } = (0, utils_1.createJobMessage)(job);
            try {
                const response = yield axios_1.axiosInstance.post("sendMessage", {
                    chat_id: chatId,
                    text: text,
                    parse_mode: parse_mode,
                    reply_markup: reply_markup,
                });
                console.log("Response:", response.data);
                // Process the response as needed
            }
            catch (error) {
                console.error("Error:", error);
                // Handle the error as needed
            }
            yield delay(delayMs); // Wait for the specified delay before the next iteration
        }
    });
}
function sendNewJobNotifications(chatId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const collection = yield (0, dbHelpers_1.getCollection)(constants_1.DB_COLLECTION);
            const newJobs = yield (0, dbHelpers_2.getNewJobsForTelegram)(collection);
            console.log(newJobs[0]);
            yield sendSequentialMessages(chatId, newJobs, 2);
            const jobUrls = newJobs.map((job) => job.url);
            yield (0, dbHelpers_1.markJobsAsSentAndDelete)(collection, jobUrls);
            return;
        }
        catch (error) {
            console.error("Error sending Telegram notifications:", error);
        }
    });
}
