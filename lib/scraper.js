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
exports.scrapeData = scrapeData;
const chrono = __importStar(require("chrono-node"));
const utils_1 = require("../utils");
const dbHelpers_1 = require("../dbHelpers");
const constants_1 = require("../constants");
// Main scraping function
function scrapeData() {
    return __awaiter(this, void 0, void 0, function* () {
        const searchTerms = [
            // "javascript",
            "developer",
            // "frontend",
            // "frontend developer",
        ];
        const jobs = [];
        const browser = yield (0, utils_1.initializeBrowser)();
        try {
            for (const term of searchTerms) {
                const termJobs = yield (0, utils_1.scrapeJobsForTerm)(browser, term);
                jobs.push(...termJobs);
            }
            const jobsWithDates = jobs.map((job) => (Object.assign(Object.assign({}, job), { postedDate: chrono.parseDate(job.posted) })));
            const uniqueJobs = (0, utils_1.removeDuplicates)(jobsWithDates);
            const sortedUniqueJobs = (0, utils_1.sortJobsByPostedDateDescending)(uniqueJobs);
            console.log(sortedUniqueJobs);
            const collection = yield (0, dbHelpers_1.getCollection)(constants_1.DB_COLLECTION);
            yield (0, dbHelpers_1.upsertJobs)(sortedUniqueJobs, collection);
        }
        catch (error) {
            console.error("Error during scraping process:", error);
        }
        finally {
            yield browser.close();
        }
    });
}
