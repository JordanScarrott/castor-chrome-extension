from playwright.sync_api import sync_playwright
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the local index.html file
        file_path = "file:///app/index.html"
        page.goto(file_path, wait_until="networkidle")
        page.wait_for_selector(".input-box")

        page.fill(".input-box", "What is the capital of France?")
        page.click(".send-button")

        # Wait for the AI's response to appear
        # This might need adjustment depending on how fast the service worker responds
        page.wait_for_selector(".message--ai .message-content:has-text('Paris')", timeout=10000)

        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot saved successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
