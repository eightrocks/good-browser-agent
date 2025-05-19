import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";
import { drawObserveOverlay, clearOverlays, actWithCache } from "./utils.js";
import { z } from 'zod';


/**
 * 🤘 Welcome to Stagehand! Thanks so much for trying us out!
 * 🛠️ CONFIGURATION: stagehand.config.ts will help you configure Stagehand
 *
 * 📝 Check out our docs for more fun use cases, like building agents
 * https://docs.stagehand.dev/
 *
 * 💬 If you have any feedback, reach out to us on Slack!
 * https://stagehand.dev/slack
 *
 * 📚 You might also benefit from the docs for Zod, Browserbase, and Playwright:
 * - https://zod.dev/
 * - https://docs.browserbase.com/
 * - https://playwright.dev/docs/intro
 */
async function main({
  page,
  context,
  stagehand,
}: {
  page: Page; // Playwright Page with act, extract, and observe methods
  context: BrowserContext; // Playwright BrowserContext
  stagehand: Stagehand; // Stagehand instance
}) {
  // Navigate to the calculator
  await page.goto("https://ix0.apps.td.com/mortgage-affordability-calculator/");
  await page.waitForTimeout(2000); // Wait for page to load

  // Step 1: Location
  const locationInputSelector = '//*[@id="municipality"]';

  // Click the location input and type into it
  await page.act("Click the location input field");
  await page.act("Type 'Waterloo, ON, Canada' into the location input field");
  
  // Wait for suggestions and click the first one
  await page.waitForSelector('.pac-container');
  await page.locator('.pac-container').locator('text=Waterloo, ON, Canada').first().click();
  
  // Click next
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 2: Property Type
  await page.act("Click on House");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 3: Annual Income
  await page.act("Click the annual income input field");
  await page.act("Type '120000' into the annual income field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 4: Down Payment
  await page.act("Click the down payment input field");
  await page.act("Type '50000' into the down payment field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 5: Monthly Expenses
  await page.act("Click the monthly expenses input field");
  await page.act("Type '2000' into the monthly expenses field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 6: Monthly Debt Payments
  await page.act("Click the monthly debt payments input field");
  await page.act("Type '500' into the monthly debt payments field");
  await page.getByRole('button', { name: 'See your results' }).click();

  // After clicking "See your results"
  await page.waitForTimeout(5000); // Wait 5 seconds for results to load

  // Log what's on the page to see what we're actually getting
  const pageContent = await page.content();
  console.log("Page content:", pageContent);

  // Try a more general selector first
  await page.waitForSelector('.results-container, .mortgage-results, [class*="result"]', { timeout: 60000 });

  // Define the result schema
  const resultSchema = z.object({
    maxPrice: z.string(),
    purchasePrice: z.string(),
    monthlyPayment: z.string(),
    otherHousingCosts: z.string(),
    remainingCash: z.string(),
    optionalCP: z.string(),
    rate: z.string(),
  });
  // Then try to extract the data
  const mortgageResults = await page.extract({
    instruction: "Find and extract the following values from the results page: 1) Maximum home price (look for text containing 'Maximum home price'), 2) Purchase price (look for text containing 'Purchase price'), 3) Monthly payment (look for text containing 'Monthly payment'), 4) Other housing costs (look for text containing 'Other housing costs'), 5) Remaining cash (look for text containing 'Remaining cash'), 6) Credit protection (look for text containing 'Credit protection'), 7) Interest rate (look for text containing 'Interest rate')",
    schema: resultSchema as any,
  }) as z.infer<typeof resultSchema>;

  console.log("Extracted results:", mortgageResults);

  // Log the results
  stagehand.log({
    category: "mortgage-calculator",
    message: "Mortgage Affordability Results",
    auxiliary: {
      maxPrice: {
        value: mortgageResults.maxPrice || "",
        type: "string",
      },
      purchasePrice: {
        value: mortgageResults.purchasePrice || "",
        type: "string",
      },
      monthlyPayment: {
        value: mortgageResults.monthlyPayment || "",
        type: "string",
      },
      otherHousingCosts: {
        value: mortgageResults.otherHousingCosts || "",
        type: "string",
      },
      remainingCash: {
        value: mortgageResults.remainingCash || "",
        type: "string",
      },
      optionalCP: {
        value: mortgageResults.optionalCP || "",
        type: "string",
      },
      rate: {
        value: mortgageResults.rate || "",
        type: "string",
      },
    },
  });
}

/**
 * This is the main function that runs when you do npm run start
 *
 * YOU PROBABLY DON'T NEED TO MODIFY ANYTHING BELOW THIS POINT!
 *
 */
async function run() {
  const stagehand = new Stagehand({
    ...StagehandConfig,
  });
  await stagehand.init();

  if (StagehandConfig.env === "BROWSERBASE" && stagehand.browserbaseSessionID) {
    console.log(
      boxen(
        `View this session live in your browser: \n${chalk.blue(
          `https://browserbase.com/sessions/${stagehand.browserbaseSessionID}`,
        )}`,
        {
          title: "Browserbase",
          padding: 1,
          margin: 3,
        },
      ),
    );
  }

  const page = stagehand.page;
  const context = stagehand.context;
  await main({
    page,
    context,
    stagehand,
  });
  await stagehand.close();
  console.log(
    `\n🤘 Thanks so much for using Stagehand! Reach out to us on Slack if you have any feedback: ${chalk.blue(
      "https://stagehand.dev/slack",
    )}\n`,
  );
}

run();