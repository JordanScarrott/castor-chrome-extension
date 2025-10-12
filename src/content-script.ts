import { ElementSelector } from "@/element-selector";

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ACTIVATE_SELECTION_MODE") {
        const elementSelector = new ElementSelector();
        elementSelector.start();
    }
});
