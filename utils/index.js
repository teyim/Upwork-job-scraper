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
exports.initializeBrowser = initializeBrowser;
exports.scrapeJobsForTerm = scrapeJobsForTerm;
exports.removeDuplicates = removeDuplicates;
exports.sortJobsByPostedDateDescending = sortJobsByPostedDateDescending;
exports.createJobMessage = createJobMessage;
const puppeteer_real_browser_1 = require("puppeteer-real-browser");
const puppeteer_1 = __importDefault(require("puppeteer"));
require("dotenv/config");
// Utility function for setting up Puppeteer browser
function initializeBrowser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { browser } = yield (0, puppeteer_real_browser_1.connect)({
                headless: true,
                args: [
                    "--disable-setuid-sandbox",
                    "--no-sandbox",
                    "--single-process",
                    "--no-zygote",
                ],
                customConfig: {},
                turnstile: true,
                connectOption: { defaultViewport: null },
                disableXvfb: false,
                ignoreAllFlags: false,
                plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
            });
            return browser;
        }
        catch (error) {
            console.error("Failed to initialize browser:", error);
            throw new Error("Browser initialization error.");
        }
    });
}
// Function to scrape jobs for a specific search term
function scrapeJobsForTerm(browser, term) {
    return __awaiter(this, void 0, void 0, function* () {
        const jobs = [];
        const searchURL = `https://www.upwork.com/nx/search/jobs/?nbs=1&q=${term}&page=1&per_page=10`;
        const page = yield browser.newPage({
            executablePath: process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer_1.default.executablePath(),
        });
        try {
            yield page.goto(searchURL, { waitUntil: "networkidle2", timeout: 0 });
            yield page.waitForSelector("section");
            const jobsData = yield page.$$eval("section > article", (jobElements) => {
                const baseURL = "https://www.upwork.com";
                return jobElements.map((job) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    return ({
                        name: ((_b = (_a = job.querySelector(".job-tile-title")) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) ||
                            "No title",
                        url: baseURL +
                            (((_c = job.querySelector(".job-tile-title > a")) === null || _c === void 0 ? void 0 : _c.getAttribute("href")) ||
                                ""),
                        posted: ((_e = (_d = job
                            .querySelector(".job-tile-header-line-height > small > span:nth-child(2)")) === null || _d === void 0 ? void 0 : _d.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || "No posted date",
                        desc: ((_g = (_f = job.querySelector(".air3-line-clamp > p")) === null || _f === void 0 ? void 0 : _f.textContent) === null || _g === void 0 ? void 0 : _g.trim()) ||
                            "No description",
                        type: ((_j = (_h = job
                            .querySelector("section > article > div > ul > li:nth-child(1) > strong")) === null || _h === void 0 ? void 0 : _h.textContent) === null || _j === void 0 ? void 0 : _j.trim()) || "No type",
                        budget: ((_l = (_k = job
                            .querySelector("section > article > div:nth-child(2) > ul > li:nth-child(3) > strong:nth-child(2)")) === null || _k === void 0 ? void 0 : _k.textContent) === null || _l === void 0 ? void 0 : _l.trim()) || "No budget",
                        sentToTelegram: false,
                        createdAt: new Date(),
                    });
                });
            });
            jobs.push(...jobsData);
        }
        catch (error) {
            console.error(`Error scraping jobs for term "${term}":`, error);
        }
        finally {
            yield page.close();
        }
        return jobs;
    });
}
// Function to remove duplicate job postings
function removeDuplicates(jobs) {
    const seenUrls = new Set();
    return jobs.filter((job) => {
        if (seenUrls.has(job.url)) {
            return false;
        }
        else {
            seenUrls.add(job.url);
            return true;
        }
    });
}
function sortJobsByPostedDateDescending(jobs) {
    return jobs.slice().sort((a, b) => {
        var _a, _b, _c, _d;
        const timeA = (_b = (_a = a === null || a === void 0 ? void 0 : a.postedDate) === null || _a === void 0 ? void 0 : _a.getTime()) !== null && _b !== void 0 ? _b : -Infinity; // Use -Infinity if 'postedDate' is null or undefined
        const timeB = (_d = (_c = b === null || b === void 0 ? void 0 : b.postedDate) === null || _c === void 0 ? void 0 : _c.getTime()) !== null && _d !== void 0 ? _d : -Infinity;
        return timeB - timeA; //sort in ascending order lastest job first
    });
}
function shortenUpworkJobUrl(url) {
    // Define a regular expression to capture the job identifier
    const regex = /~([0-9a-f]+)/;
    // Execute the regex on the provided URL
    const match = regex.exec(url);
    // If a match is found, construct the shortened URL
    if (match) {
        const jobId = match[0]; // This includes the '~' prefix
        return `https://www.upwork.com/jobs/${jobId}`;
    }
    // Return null if the URL doesn't match the expected pattern
    return null;
}
function createJobMessage(job) {
    return {
        text: `💼 <strong>Job</strong>: \n${job.name}\n\n` +
            `📅 <strong>Posted</strong>: \n${job.posted || "N/A"}\n\n` +
            `📝 <strong>Description</strong>:\n${job.desc
                ? `<blockquote expandable>${job.desc}</blockquote>`
                : "No description available"}\n\n` +
            `💰 <strong>Budget</strong>:* \n${job.budget || "Not specified"}`,
        parse_mode: "HTML",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔗 Open Job", url: shortenUpworkJobUrl(job.url) }, // Button for the job URL
                ],
            ],
        },
    };
}
