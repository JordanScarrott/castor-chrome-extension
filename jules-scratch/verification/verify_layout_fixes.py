from playwright.sync_api import sync_playwright, expect
import os

def verify_layout_fixes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute path to the HTML file
        html_file = os.path.abspath('dist/index.html')
        page.goto(f"file://{html_file}")

        # 1. Verify the welcome animation is visible
        page.wait_for_timeout(500) # Wait for animation to start
        page.screenshot(path="jules-scratch/verification/01_welcome_animation.png")

        # 2. Verify the goal-setting screen
        page.wait_for_timeout(2500) # Wait for animation to complete

        header = page.get_by_role("banner")
        expect(header).to_be_visible()

        page.screenshot(path="jules-scratch/verification/02_goal_view.png")

        # 3. Verify the chat screen
        goal_input = page.locator(".goal-input")
        goal_input.fill("Test Goal")
        goal_input.press("Enter")

        chat_container = page.locator(".chat-container")
        expect(chat_container).to_be_visible()

        expect(header).to_be_visible()

        page.screenshot(path="jules-scratch/verification/03_chat_view.png")

        browser.close()

if __name__ == "__main__":
    verify_layout_fixes()
