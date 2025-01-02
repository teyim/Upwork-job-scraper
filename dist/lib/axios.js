"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.axiosInstance = void 0;
const constants_1 = require("./../constants");
const axios_1 = __importDefault(require("axios"));
exports.axiosInstance = axios_1.default.create({
    baseURL: constants_1.TELEGRAM_API,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});
