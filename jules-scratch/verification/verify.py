import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the local extension page
        extension_path = os.path.abspath('dist/index.html')
        await page.goto(f'file://{extension_path}')

        # The Header appears after the welcome animation, so wait for it using its class.
        await expect(page.locator(".app-header")).to_be_visible(timeout=15000)

        # Now the goal input should be available
        goal_input = page.locator('.goal-input')
        await expect(goal_input).to_be_visible()

        await goal_input.fill('Test Goal')
        await goal_input.press('Enter')

        # After submitting the goal, a new view is loaded.
        # The header should still be visible in the new view.
        await expect(page.locator(".app-header")).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
