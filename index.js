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
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
const constants_1 = require("./constants");
const lib_1 = require("./lib");
require("./cron-job");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(`${constants_1.TELEGRAM_API}/setwebhook?url=${constants_1.WEBHOOK_URL}`);
    console.log(response.data);
});
app.post("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield (0, lib_1.handler)(req));
    return;
}));
app.get("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send(yield (0, lib_1.handler)(req));
    return;
}));
app.listen(process.env.port || 5000, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("app is running on port", process.env.port || 5000);
    yield init();
}));
