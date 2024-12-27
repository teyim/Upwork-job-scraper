"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const puppeteer_real_browser_1 = require("puppeteer-real-browser");
require("dotenv/config");
const mongodb_1 = require("mongodb");
const chrono = __importStar(require("chrono-node"));
const databaseUrl = process.env.MONGO_URI;
const client = new mongodb_1.MongoClient(databaseUrl !== null && databaseUrl !== void 0 ? databaseUrl : "", {});
function scrapeData() {
    return __awaiter(this, void 0, void 0, function* () {
        const baseURL = "https://www.upwork.com";
        const searchTerms = [
            "javascript",
            "developer",
            "frontend",
            "frontend developer",
        ];
        const jobs = [];
        const { browser } = yield (0, puppeteer_real_browser_1.connect)({
            headless: false,
            args: ["--start-maximized"],
            customConfig: {},
            turnstile: true,
            connectOption: { defaultViewport: null },
            disableXvfb: false,
            ignoreAllFlags: false,
            plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
        });
        for (const term of searchTerms) {
            const searchURL = `${baseURL}/nx/search/jobs/?nbs=1&q=${term}&page=1&per_page=10`;
            const page = yield browser.newPage();
            yield page.goto(searchURL);
            // Wait for the section containing job listings to load
            const sectionSelector = "section";
            yield page.waitForSelector(sectionSelector);
            // Extract job postings
            const jobsData = yield page.$$eval(`${sectionSelector} > article`, (jobs) => {
                const baseURL = "https://www.upwork.com";
                return jobs.map((job) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    return {
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
                    };
                });
            });
            // Append the current search term's results to the main jobs array
            jobs.push(...jobsData);
            // Close the current page to free up resources
            yield page.close();
        }
        const jobsWithDates = jobs.map((job) => {
            const parsedDate = chrono.parseDate(job.posted);
            return Object.assign(Object.assign({}, job), { postedDate: parsedDate });
        });
        // Sort jobs by postedDate in descending order (most recent first)
        jobsWithDates.sort((a, b) => {
            if (a.postedDate && b.postedDate) {
                return b.postedDate.getTime() - a.postedDate.getTime();
            }
            return 0;
        });
        // Remove duplicate job postings based on the 'url' property
        const uniqueJobs = removeDuplicates(jobsWithDates);
        // Output the unique job postings
        console.log(uniqueJobs);
        // add data to database
        try {
            yield client.connect();
            const database = client.db("teyim");
            const collection = database.collection("upwork-jobs");
            // const result = await collection.insertMany(uniqueJobs);
            const bulkOps = uniqueJobs.map((job) => ({
                updateOne: {
                    filter: { url: job.url },
                    update: { $set: job },
                    upsert: true,
                },
            }));
            const result = yield collection.bulkWrite(bulkOps);
            console.log(`${result.insertedCount} documents were inserted.`);
        }
        catch (error) {
            console.error("An error occurred while inserting documents:", error);
        }
        finally {
            yield client.close();
        }
        // Close the browser
        yield browser.close();
    });
}
// Function to remove duplicate job postings based on a unique property
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
// Call the function to start scraping
scrapeData().catch((error) => {
    console.error("An error occurred during scraping:", error);
});
