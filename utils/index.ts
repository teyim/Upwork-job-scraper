import { connect } from "puppeteer-real-browser";
import { JobPost } from "../types";
import puppeteer from "puppeteer";
import "dotenv/config";

// Utility function for setting up Puppeteer browser
export async function initializeBrowser() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: "/usr/bin/google-chrome-stable",
      timeout: 0,
    });
    return browser;
  } catch (error) {
    console.error("Failed to initialize browser:", error);
    throw new Error("Browser initialization error.");
  }
}

// Function to scrape jobs for a specific search term
export async function scrapeJobsForTerm(
  browser: any,
  term: string
): Promise<JobPost[]> {
  const jobs: JobPost[] = [];
  const searchURL = `https://www.upwork.com/nx/search/jobs/?nbs=1&q=${term}&page=1&per_page=10`;
  const page = await browser.newPage();

  try {
    await page.goto(searchURL, { waitUntil: "networkidle2", timeout: 0 });
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
          sentToTelegram: false,
          createdAt: new Date(),
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

function shortenUpworkJobUrl(url: string): string | null {
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

export function createJobMessage(job: JobPost) {
  return {
    text:
      `💼 <strong>Job</strong>: \n${job.name}\n\n` +
      `📅 <strong>Posted</strong>: \n${job.posted || "N/A"}\n\n` +
      `📝 <strong>Description</strong>:\n${
        job.desc
          ? `<blockquote expandable>${job.desc}</blockquote>`
          : "No description available"
      }\n\n` +
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
