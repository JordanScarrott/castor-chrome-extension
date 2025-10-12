// src/popup/composables/usePageAttachment.ts
export function usePageAttachment() {
  const attachFromPage = async () => {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        const tabId = tabs[0].id;
        if (tabId) {
          await chrome.tabs.sendMessage(tabId, { type: "ACTIVATE_SELECTION_MODE" });
          window.close();
        }
      }
    } catch (error) {
      console.error("Error activating selection mode:", error);
    }
  };

  return {
    attachFromPage,
  };
}
