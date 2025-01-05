import { connect } from "puppeteer-real-browser";
import { JobPost } from "../types";
import puppeteer from "puppeteer";
import "dotenv/config";

// Utility function for setting up Puppeteer browser
export async function initializeBrowser() {
  try {
    const { browser } = await connect({
      args: ['--start-maximized','--disable-gpu','--no-sandbox','--disable-setuid-sandbox','--disable-web-security' ],
      turnstile: true,
      headless: false,
      // disableXvfb: true,
      customConfig: {},
      connectOption: {
        defaultViewport: null,
      },
      plugins: [require("puppeteer-extra-plugin-click-and-wait")()],
    });
    return browser;
  } catch (error) {
    console.error("Failed to initialize browser:", error);
    throw new Error("Browser initialization error.");
  }
}

export function shortenUpworkJobUrl(url: string): string | null {
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
  return "";
}

// Function to scrape jobs for a specific search term
export async function scrapeJobsForTerm(
  browser: any,
  term: string
): Promise<JobPost[]> {
  const jobs: JobPost[] = [];
  const searchURL = `https://www.upwork.com/nx/search/jobs/?nbs=1&q=${term}&page=1&per_page=10`;
  const page = await browser.newPage({
    executablePath: "/usr/bin/google-chrome-stable",
  });
  page.setDefaultNavigationTimeout(0);

  try {
    await page.goto(searchURL, { waitUntil: "domcontentloaded", timeout: 0 });

    await page.waitForSelector("section");

    const jobsData = await page.$$eval(
      "section > article",
      (jobElements: any) => {
        const baseURL = "https://www.upwork.com";

        return jobElements.map((job: any) => ({
          name:
            job.querySelector(".job-tile-title")?.textContent?.trim() ||
            "No title",
          url:
            job.querySelector(".job-tile-title > a")?.getAttribute("href") ||
            "",

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
          sentToTelegram: false,
          createdAt: new Date().toISOString(),
        }));
      }
    );

    jobs.push(...jobsData);
  } catch (error) {
    console.error(`Error scraping jobs for term "${term}":`, error);
  } finally {
    await page.close();
  }

  return jobs;
}

// Function to remove duplicate job postings
export function removeDuplicates(jobs: JobPost[]): JobPost[] {
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

export function sortJobsByPostedDateDescending(jobs: JobPost[]): JobPost[] {
  return jobs.slice().sort((a, b) => {
    const timeA = a?.postedDate?.getTime() ?? -Infinity; // Use -Infinity if 'postedDate' is null or undefined
    const timeB = b?.postedDate?.getTime() ?? -Infinity;
    return timeB - timeA; //sort in ascending order lastest job first
  });
}

export function createJobMessage(job: JobPost) {
  return {
    text:
      `<strong>${job.name}</strong>\n\n` +
      `📅 <strong>Posted</strong>: \n${job.posted || "N/A"}\n\n` +
      `📝 <strong>Description</strong>:\n${
        job.desc
          ? `<blockquote expandable>${job.desc}</blockquote>`
          : "No description available"
      }\n\n` +
      `💰 <strong>Budget</strong>: \n${job.budget || "Not specified"}`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔗 Open Job", url: job.url }, // Button for the job URL
        ],
      ],
    },
  };
}
