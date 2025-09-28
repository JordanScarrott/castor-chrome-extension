import { routeMessage } from "@/service-worker-2/router";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Service worker received message:", message);
    routeMessage(message)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
    return true; // Keep the message channel open for async response
});

console.log("Mangle service worker loaded with API router.");
