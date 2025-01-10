import { JobPost } from "../types";
import * as chrono from "chrono-node";
import {
  initializeBrowser,
  removeDuplicates,
  scrapeJobsForTerm,
  shortenUpworkJobUrl,
  sortJobsByPostedDateDescending,
} from "../utils";

import { closeDatabase, getCollection, upsertJobs } from "../dbHelpers";
import { DB_COLLECTION } from "../constants";

// Main scraping function
export async function scrapeData() {
  const searchTerms = [
    "javascript",
    "developer",
    "frontend",
    "frontend developer",
    "React",
    "Nextjs",
    "Typescript",
    "Tailwindcss",
  ];
  const jobs: JobPost[] = [];
  const browser = await initializeBrowser();

  try {
    for (const term of searchTerms) {
      const termJobs = await scrapeJobsForTerm(browser, term);
      jobs.push(...termJobs);
    }

    const jobsWithDatesAndIds = jobs.map((job) => {
      const shortenedUrl = shortenUpworkJobUrl(job.url);
      const jobIdMatch = /~([0-9a-f]+)/.exec(job.url); // Extract the job ID using regex

      return {
        ...job,
        postedDate: chrono.parseDate(job.posted) as any,
        url: shortenedUrl ?? "", // Add shortened URL
        jobId: jobIdMatch ? jobIdMatch[1] : "0", // Add jobId (only the ID without '~')
      };
    });

    const uniqueJobs = removeDuplicates(jobsWithDatesAndIds);

    const sortedUniqueJobs = sortJobsByPostedDateDescending(uniqueJobs);

    const collection = await getCollection(DB_COLLECTION);

    await upsertJobs(sortedUniqueJobs, collection);
  } catch (error) {
    console.error("Error during scraping process:", error);
  } finally {
    await browser.close();
  }
}
