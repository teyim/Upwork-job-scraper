import { Collection, Db, MongoClient } from "mongodb";
import { JobPost } from "./types";
import { databaseUrl, DB_COLLECTION, DB_NAME } from "./constants";

// Singleton client instance to ensure a single connection throughout the app
let client: MongoClient | null = null;
let database: Db | null = null;

async function initDatabase(): Promise<Db> {
  if (database) return database;

  try {
    if (!client) {
      client = new MongoClient(databaseUrl);
    }

    await client.connect();

    database = client.db(DB_NAME);

    // Example index creation for "jobs" collection
    const jobsCollection = database.collection(DB_COLLECTION);
    await jobsCollection.createIndex({ jobId: 1 }, { unique: true });
    await jobsCollection.createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 300,
        partialFilterExpression: { sentToTelegram: true },
      }
    );

    console.log("Database connected and indexes ensured.");
    return database;
  } catch (error) {
    console.error("Error initializing database:", error);
    throw new Error("Failed to initialize database.");
  }
}

export async function getCollection(
  collectionName: string
): Promise<Collection<JobPost>> {
  try {
    const db = await initDatabase();
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error getting collection '${collectionName}':`, error);
    throw new Error(`Failed to get collection: ${collectionName}`);
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (client) {
      await client.close();
      client = null;
      database = null;
      console.log("Database connection closed.");
    }
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw new Error("Failed to close database connection.");
  }
}

export async function upsertJobs(
  jobs: JobPost[],
  jobsCollection: Collection<JobPost>
): Promise<void> {
  try {
    const bulkOps = jobs.map((job) => ({
      updateOne: {
        filter: { jobId: job.jobId }, // Use URL as the unique identifier
        update: { $setOnInsert: job }, // insert the job
        upsert: true, // insert job if no match is found
      },
    }));

    if (bulkOps.length > 0) {
      const result = await jobsCollection.bulkWrite(bulkOps, {
        ordered: false,
      });
      console.log(
        `${result.upsertedCount} new jobs inserted, ${result.modifiedCount} updated.`
      );
    }
  } catch (error) {
    console.error("Error upserting jobs:", error);
  }
}

export async function getNewJobsForTelegram(
  jobsCollection: Collection<JobPost>
): Promise<JobPost[]> {
  try {
    return (
      (await jobsCollection
        .find({ sentToTelegram: { $ne: true } })
        .toArray()) ?? []
    );
  } catch (error) {
    console.error("Error getting new jobs for telegram", error);
    return [];
  }
}

export async function deleteSentJobs(
  jobsCollection: Collection<JobPost>
): Promise<void> {
  try {
    const result = await jobsCollection.deleteMany({ sentToTelegram: true });
    console.log(`Deleted ${result.deletedCount} jobs.`);
  } catch (error) {
    console.error("Error deleting sent jobs", error);
  }
}

export async function markJobsAsSent(
  jobsCollection: Collection<JobPost>,
  jobId: string
): Promise<void> {
  try {
    await jobsCollection.updateOne(
      { jobId: jobId },
      { $set: { sentToTelegram: true } }
    );
  } catch (error) {
    console.error("Error marking and deleting jobs after sending", error);
  }
}
