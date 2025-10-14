// src/service-worker-2/handlers/elementSelectionHandler.ts

import { geminiNanoService } from "../geminiNano/geminiNanoService";

export async function handleElementSelection(html: string) {
    const schema = {
        "type": "object",
        "properties": {
            "extracted_text": {
                "type": "string"
            }
        }
    };

    const userPrompt = `Here is some HTML: ${html}. Please extract the inner text from it.`;

    const result = await geminiNanoService.askPrompt<{ extracted_text: string }>(userPrompt, undefined, schema);

    if (typeof result === 'object' && result.extracted_text) {
        // Forward the message to the popup
        await chrome.runtime.sendMessage({
            type: 'DISPLAY_SELECTED_TEXT',
            payload: result.extracted_text,
        });
    } else {
        // Handle the case where the result is not in the expected format
        await chrome.runtime.sendMessage({
            type: 'DISPLAY_SELECTED_TEXT',
            payload: "Could not extract text from the selected element.",
        });
    }
}
