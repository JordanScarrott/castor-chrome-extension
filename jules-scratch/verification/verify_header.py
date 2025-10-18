import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local extension page
        await page.goto("file:///app/dist/index.html")

        # The WelcomeScreen is the first thing to appear.
        welcome_screen = page.locator(".welcome-container")

        # First, we assert that the welcome screen is visible.
        await expect(welcome_screen).to_be_visible(timeout=5000)

        # Now, we wait for it to DISAPPEAR. This indicates the animation is complete.
        await expect(welcome_screen).not_to_be_visible(timeout=5000)

        # Now that the animation is complete, the header should be visible.
        header = page.locator(".app-header")
        await expect(header).to_be_visible(timeout=1000) # Should now be visible quickly

        # Take a screenshot of just the header
        await header.screenshot(path="jules-scratch/verification/header_verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
