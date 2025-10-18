from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        file_path = os.path.abspath('dist/index.html')

        # Navigate to the local HTML file
        page.goto(f'file://{file_path}')

        # Wait for the animation to complete by waiting for the title of the next screen
        page.wait_for_selector('h1.tagline', timeout=15000)

        # Take a screenshot of the goal view
        page.screenshot(path='jules-scratch/verification/goal-view.png')

        browser.close()

if __name__ == "__main__":
    run()
