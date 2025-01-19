import { connect } from "puppeteer-real-browser";
import { JobPost } from "../types";
import puppeteer from "puppeteer";
import "dotenv/config";

// Utility function for setting up Puppeteer browser
export async function initializeBrowser() {
  try {
    const { browser } = await connect({
      args: [
        "--no-sandbox",
        "--start-maximized",
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--disable-web-security",
      ],
      turnstile: true,
      headless: false,
      disableXvfb: false,
      connectOption: {},
      ignoreAllFlags: false,
      customConfig: {},
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

    const text = await page.evaluate(() => {
      const element = document.querySelector(
        "#main > div > div > div > div:nth-child(1) > header"
      );
      return element ? element?.textContent?.trim() : null;
    });

    console.log("Extracted Text:", text);

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
  const maxMessageLength = 3000;
  const ellipsis = "...";

  // Construct the message components
  const jobName = `<strong>${job.name}</strong>\n\n`;
  const postedDate = `📅 <strong>Posted</strong>: \n${job.posted || "N/A"}\n\n`;
  const budget = `💰 <strong>Budget</strong>: \n${
    job.budget || "Not specified"
  }`;

  // Function to calculate the total message length
  const calculateMessageLength = (description: string) => {
    return (
      jobName.length +
      postedDate.length +
      budget.length +
      description.length +
      50 // Additional buffer for formatting and safety
    );
  };

  // Truncate the description if necessary
  let description = job.desc
    ? `<blockquote expandable>${job.desc}</blockquote>`
    : "No description available";

  if (calculateMessageLength(description) > maxMessageLength) {
    const availableLength = maxMessageLength - calculateMessageLength("");
    const truncatedDescription = job.desc.slice(
      0,
      availableLength - ellipsis.length
    );
    description = `<blockquote expandable>${truncatedDescription}${ellipsis}</blockquote>`;
  }

  // Construct the final message text
  const messageText =
    jobName +
    postedDate +
    `📝 <strong>Description</strong>:\n${description}\n\n` +
    budget;

  return {
    text: messageText,
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
