from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the local file
        file_path = os.path.abspath('dist/index.html')
        page.goto(f'file://{file_path}')

        # Wait for the welcome screen animation to complete
        animation_wrapper = page.locator('.animation-wrapper')
        animation_wrapper.wait_for(state='hidden', timeout=10000)

        # Enter a goal
        goal_input = page.locator('.goal-input')
        goal_input.fill('Find a hotel in Cape Town')

        # Take a screenshot
        page.screenshot(path='jules-scratch/verification/verification.png')

        browser.close()

run()
