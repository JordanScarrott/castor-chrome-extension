import { Readability } from "@mozilla/readability";
import { ElementSelector } from "./element-selector";

const article = new Readability(document.cloneNode(true)).parse();

if (article) {
    chrome.runtime.sendMessage({
        type: "parsed-article",
        payload: article,
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ACTIVATE_SELECTION_MODE") {
        const elementSelector = new ElementSelector();
        elementSelector.start();
    }
});
