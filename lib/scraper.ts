import { JobPost } from "../types";
import * as chrono from "chrono-node";
import {
  initializeBrowser,
  removeDuplicates,
  scrapeJobsForTerm,
  sortJobsByPostedDateDescending,
} from "../utils";

import { closeDatabase, getCollection, upsertJobs } from "../dbHelpers";
import { DB_COLLECTION } from "../constants";

// Main scraping function
export async function scrapeData() {
  const searchTerms = [
    "javascript",
    "developer",
    // "frontend",
    // "frontend developer",
  ];
  const jobs: JobPost[] = [];
  const browser = await initializeBrowser();

  try {
    for (const term of searchTerms) {
      const termJobs = await scrapeJobsForTerm(browser, term);
      jobs.push(...termJobs);
    }

    const jobsWithDates = jobs.map((job) => ({
      ...job,
      postedDate: chrono.parseDate(job.posted) as any,
    }));

    const uniqueJobs = removeDuplicates(jobsWithDates);

    const sortedUniqueJobs = sortJobsByPostedDateDescending(uniqueJobs);

    const collection = await getCollection(DB_COLLECTION);

    await upsertJobs(sortedUniqueJobs, collection);
  } catch (error) {
    console.error("Error during scraping process:", error);
  } finally {
    await browser.close();
  }
}
