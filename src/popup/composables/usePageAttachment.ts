// src/popup/composables/usePageAttachment.ts
export function usePageAttachment() {
    const attachFromPage = async () => {
        try {
            const tabs = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (tabs.length > 0 && tabs[0].id) {
                const tabId = tabs[0].id;

                // Create a new popup window to keep it open
                const currentWindow = await chrome.windows.getCurrent();
                await chrome.windows.create({
                    url: "index.html",
                    type: "popup",
                    width: currentWindow.width,
                    height: currentWindow.height,
                    left: currentWindow.left,
                    top: currentWindow.top,
                });

                // Activate selection mode in the content script
                await chrome.tabs.sendMessage(tabId, {
                    type: "ACTIVATE_SELECTION_MODE",
                });
                window.close();
            }
        } catch (error) {
            console.error("Error activating selection mode:", error);
        }
    };

    return {
        attachFromPage,
    };
}
