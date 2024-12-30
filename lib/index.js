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
exports.handler = handler;
const Telegram_1 = require("./Telegram");
function handler(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const { body } = req;
        if (body) {
            const chatId = body.message.chat.id;
            const messageText = body.message.text;
            console.log(chatId);
            yield (0, Telegram_1.sendNewJobNotifications)(chatId);
        }
        return;
    });
}
