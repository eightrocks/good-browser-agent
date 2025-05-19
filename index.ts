import { Stagehand, Page, BrowserContext } from "@browserbasehq/stagehand";
import StagehandConfig from "./stagehand.config.js";
import chalk from "chalk";
import boxen from "boxen";
import { drawObserveOverlay, clearOverlays, actWithCache } from "./utils.js";
import { z, AnyZodObject } from 'zod';


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
  await actWithCache(page, "Click the location input field");
  await actWithCache(page, "Type 'Waterloo, ON, Canada' into the location input field");
  
  // Wait for suggestions and click the first one
  await page.waitForSelector('.pac-container');
  await page.locator('.pac-container').locator('text=Waterloo, ON, Canada').first().click();
  
  // Click next
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 2: Property Type
  await actWithCache(page, "Click on House");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 3: Annual Income
  await actWithCache(page, "Click the annual income input field");
  await actWithCache(page, "Type '120000' into the annual income field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 4: Down Payment
  await actWithCache(page, "Click the down payment input field");
  await actWithCache(page, "Type '50000' into the down payment field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 5: Monthly Expenses
  await actWithCache(page, "Click the monthly expenses input field");
  await actWithCache(page, "Type '2000' into the monthly expenses field");
  await page.getByRole('button', { name: 'Next' }).click();

  // Step 6: Monthly Debt Payments
  await actWithCache(page, "Click the monthly debt payments input field");
  await actWithCache(page, "Type '500' into the monthly debt payments field");
  await page.getByRole('button', { name: 'See your results' }).click();

  // Wait for results to load
  await page.waitForSelector('text=Maximum home price you can afford');

  // Extract all results with proper schema
  const mortgageResults = await page.extract({
    instruction: "Extract ALL mortgage calculation results including maximum price, purchase price, monthly payment, other costs, remaining cash, credit protection, and interest rate",
    schema: z.object({
      maxPrice: z.string(),
      purchasePrice: z.string(),
      monthlyPayment: z.string(),
      otherHousingCosts: z.string(),
      remainingCash: z.string(),
      optionalCP: z.string(),
      rate: z.string(),
    }),
  });

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
