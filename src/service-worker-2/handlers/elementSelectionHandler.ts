// src/service-worker-2/handlers/elementSelectionHandler.ts

export async function handleElementSelection(payload: string) {
    // Forward the message to the popup
    await chrome.runtime.sendMessage({
        type: 'DISPLAY_SELECTED_TEXT',
        payload: payload,
    });
}
