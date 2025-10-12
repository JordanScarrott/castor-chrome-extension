// This line is crucial. It tells Vite to find wasm_exec.js and include its
// contents directly in the final background.js bundle.
// This makes the `Go` class available globally in the service worker.
import "@/../public/mangle/wasm_exec.js";

import { routeMessage } from "@/service-worker-2/router";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Service worker received message:", message);
    routeMessage(message)
        .then(sendResponse)
        .catch((error) => sendResponse({ error: error.message }));
});

console.log("Mangle service worker loaded with API router.");
