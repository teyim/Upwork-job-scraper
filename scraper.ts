import { JobPost } from "./types";
import puppeteer from "puppeteer";
import { connect } from "puppeteer-real-browser";
import "dotenv/config";
import { MongoClient } from "mongodb";
import * as chrono from "chrono-node";

const databaseUrl = process.env.MONGO_URI;

const client = new MongoClient(databaseUrl ?? "", {});

async function scrapeData() {
  const baseURL = "https://www.upwork.com";
  const searchTerms = [
    "javascript",
    "developer",
    "frontend",
    "frontend developer",
  ];
  const jobs: JobPost[] = [];

  const { browser } = await connect({
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
    const page = await browser.newPage();
    await page.goto(searchURL);

    // Wait for the section containing job listings to load
    const sectionSelector = "section";
    await page.waitForSelector(sectionSelector);

    // Extract job postings
    const jobsData = await page.$$eval(
      `${sectionSelector} > article`,
      (jobs) => {
        const baseURL = "https://www.upwork.com";

        return jobs.map((job) => {
          return {
            name:
              job.querySelector(".job-tile-title")?.textContent?.trim() ||
              "No title",
            url:
              baseURL +
              (job.querySelector(".job-tile-title > a")?.getAttribute("href") ||
                ""),
            posted:
              job
                .querySelector(
                  ".job-tile-header-line-height > small > span:nth-child(2)"
                )
                ?.textContent?.trim() || "No posted date",
            desc:
              job.querySelector(".air3-line-clamp > p")?.textContent?.trim() ||
              "No description",
            type:
              job
                .querySelector(
                  "section > article > div > ul > li:nth-child(1) > strong"
                )
                ?.textContent?.trim() || "No type",
            budget:
              job
                .querySelector(
                  "section > article > div:nth-child(2) > ul > li:nth-child(3) > strong:nth-child(2)"
                )
                ?.textContent?.trim() || "No budget",
          };
        });
      }
    );

    // Append the current search term's results to the main jobs array
    jobs.push(...jobsData);

    // Close the current page to free up resources
    await page.close();
  }

  const jobsWithDates = jobs.map((job) => {
    const parsedDate = chrono.parseDate(job.posted);
    return { ...job, postedDate: parsedDate };
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
    await client.connect();
    const database = client.db("teyim");
    const collection = database.collection<JobPost>("upwork-jobs");

    // const result = await collection.insertMany(uniqueJobs);

    const bulkOps = uniqueJobs.map((job) => ({
      updateOne: {
        filter: { url: job.url },
        update: { $set: job },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(bulkOps);
    console.log(`${result.insertedCount} documents were inserted.`);
  } catch (error) {
    console.error("An error occurred while inserting documents:", error);
  } finally {
    await client.close();
  }

  // Close the browser
  await browser.close();
}

// Function to remove duplicate job postings based on a unique property
function removeDuplicates(jobs: JobPost[]): JobPost[] {
  const seenUrls = new Set();
  return jobs.filter((job) => {
    if (seenUrls.has(job.url)) {
      return false;
    } else {
      seenUrls.add(job.url);
      return true;
    }
  });
}

// Call the function to start scraping
scrapeData().catch((error) => {
  console.error("An error occurred during scraping:", error);
});
