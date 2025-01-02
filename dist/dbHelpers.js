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
exports.getCollection = getCollection;
exports.closeDatabase = closeDatabase;
exports.upsertJobs = upsertJobs;
exports.getNewJobsForTelegram = getNewJobsForTelegram;
exports.deleteSentJobs = deleteSentJobs;
exports.markJobsAsSentAndDelete = markJobsAsSentAndDelete;
const mongodb_1 = require("mongodb");
const constants_1 = require("./constants");
// Singleton client instance to ensure a single connection throughout the app
let client = null;
let database = null;
function initDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        if (database)
            return database;
        try {
            if (!client) {
                client = new mongodb_1.MongoClient(constants_1.databaseUrl);
            }
            yield client.connect();
            database = client.db(constants_1.DB_NAME);
            // Example index creation for "jobs" collection
            const jobsCollection = database.collection(constants_1.DB_COLLECTION);
            yield jobsCollection.createIndex({ url: 1 }, { unique: true });
            yield jobsCollection.createIndex({ createdAt: 1 }, {
                expireAfterSeconds: 300,
                partialFilterExpression: { sentToTelegram: true },
            });
            console.log("Database connected and indexes ensured.");
            return database;
        }
        catch (error) {
            console.error("Error initializing database:", error);
            throw new Error("Failed to initialize database.");
        }
    });
}
function getCollection(collectionName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield initDatabase();
            return db.collection(collectionName);
        }
        catch (error) {
            console.error(`Error getting collection '${collectionName}':`, error);
            throw new Error(`Failed to get collection: ${collectionName}`);
        }
    });
}
function closeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (client) {
                yield client.close();
                client = null;
                database = null;
                console.log("Database connection closed.");
            }
        }
        catch (error) {
            console.error("Error closing database connection:", error);
            throw new Error("Failed to close database connection.");
        }
    });
}
function upsertJobs(jobs, jobsCollection) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(jobs);
        try {
            const bulkOps = jobs.map((job) => ({
                updateOne: {
                    filter: { url: job.url }, // Use URL as the unique identifier
                    update: { $setOnInsert: job }, // insert the job
                    upsert: true, // insert job if no match is found
                },
            }));
            if (bulkOps.length > 0) {
                const result = yield jobsCollection.bulkWrite(bulkOps, {
                    ordered: false,
                });
                console.log(`${result.upsertedCount} new jobs inserted, ${result.modifiedCount} updated.`);
            }
        }
        catch (error) {
            console.error("Error upserting jobs:", error);
        }
    });
}
function getNewJobsForTelegram(jobsCollection) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            return ((_a = (yield jobsCollection
                .find({ sentToTelegram: { $ne: true } })
                .toArray())) !== null && _a !== void 0 ? _a : []);
        }
        catch (error) {
            console.error("Error getting new jobs for telegram", error);
            return [];
        }
    });
}
function deleteSentJobs(jobsCollection) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield jobsCollection.deleteMany({ sentToTelegram: true });
            console.log(`Deleted ${result.deletedCount} jobs.`);
        }
        catch (error) {
            console.error("Error deleting sent jobs", error);
        }
    });
}
function markJobsAsSentAndDelete(jobsCollection, jobUrls) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield jobsCollection.updateMany({ url: { $in: jobUrls } }, { $set: { sentToTelegram: true } });
        }
        catch (error) {
            console.error("Error marking and deleting jobs after sending", error);
        }
    });
}
