// Recommendation: For the most stable experience with experimental features,
// it's best to run this script against Chrome Canary. You can do this by
// changing 'chromium' to 'chrome' and setting the 'channel' to 'chrome-canary'.
// Make sure you have Chrome Canary installed.

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOPPING_GOAL = 'find cheapest laptop under $500';

async function runTest() {
    console.log('Launching browser with Gemini Nano feature flags...');

    const browser = await chromium.launch({
        headless: true, // Set to false to see the browser UI
        args: [
            '--enable-features=prompt-api-for-gemini-nano,optimization-guide-on-device-model'
        ],
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // Log console messages from the page for easier debugging
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));

    try {
        const htmlPath = path.resolve(__dirname, 'index.html');
        console.log(`Navigating to local page: ${htmlPath}`);
        await page.goto(`file://${htmlPath}`);

        console.log(`Prompting model with goal: "${SHOPPING_GOAL}"`);
        await page.evaluate((goal) => window.runGeminiTest(goal), SHOPPING_GOAL);

        // Wait for the output to be populated
        await page.waitForSelector('#output:not(:empty)', { timeout: 60000 }); // 60s timeout for model download

        const mangleQueryString = await page.textContent('#output');

        if (mangleQueryString.includes("error") || mangleQueryString.includes("not available")) {
             throw new Error(`Test failed. Output from page: ${mangleQueryString}`);
        }

        console.log('\n--- Generated Mangle Query ---');
        console.log(mangleQueryString);
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