// Recommendation: For the most stable experience with experimental features,
// it's best to run this script against Chrome Canary. This script is configured
// to use the 'chrome' browser type with the 'chrome-canary' channel.
// Make sure you have Chrome Canary installed on your system.

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOPPING_GOAL = 'find cheapest laptop under $500';

async function runTest() {
    console.log('Launching browser with updated Gemini Nano feature flags...');

    // Use the 'chrome' browser type to allow specifying the 'chrome-canary' channel.
    // This is more likely to have the latest experimental APIs.
    const browser = await chromium.launch({
        channel: 'chrome-canary', // Use Chrome Canary
        headless: true, // Headless is often required in CI/CD environments
        args: [
            '--enable-features=PromptApiForGeminiNano,OptimizationGuideOnDeviceModel',
            // The following flags can help in some environments.
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Log console messages from the page for easier debugging
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));

    try {
        const htmlPath = path.resolve(__dirname, 'index.html');
        console.log(`Navigating to local page: file://${htmlPath}`);
        await page.goto(`file://${htmlPath}`);

        console.log(`Prompting model with goal: "${SHOPPING_GOAL}"`);

        // The updated runGeminiTest function will now return a promise with the result.
        const mangleQuery = await page.evaluate((goal) => window.runGeminiTest(goal), SHOPPING_GOAL);

        console.log('\n--- Generated Mangle Query ---');
        console.log(JSON.stringify(mangleQuery, null, 2));
        console.log('----------------------------\n');

    } catch (error) {
        console.error('\n--- An error occurred during the test ---');
        console.error(error.message);
        console.error('-------------------------------------------\n');
        process.exit(1); // Exit with an error code
    } finally {
        await browser.close();
    }
}

runTest();