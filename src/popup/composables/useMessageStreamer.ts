// src/popup/composables/useMessageStreamer.ts

import { onMounted, onUnmounted, type Ref } from 'vue';

/**
 * Defines the contract for the Chat component that the composable will interact with.
 * This ensures type safety and clarifies the dependencies of the composable.
 */
export interface ChatComponentExposed {
    streamAiResponse: (messageId: string) => (textChunk: string) => void;
}

/**
 * Defines the structure of the payload for STREAM_UPDATE messages.
 */
interface StreamUpdatePayload {
    messageId: string;
    chunk: string;
    isLast: boolean;
}

/**
 * A Vue Composable to handle streaming AI responses from the service worker.
 * It listens for 'STREAM_UPDATE' messages and updates the chat UI accordingly.
 *
 * @param chatRef A Vue Ref pointing to the Chat component instance.
 */
export function useMessageStreamer(chatRef: Ref<ChatComponentExposed | null>) {
    /**
     * A map to store the update functions for each ongoing message stream.
     * The key is the messageId (string), and the value is the function to call with new chunks.
     */
    const streamUpdaters = new Map<string, (chunk: string) => void>();

    /**
     * Handles incoming messages from the Chrome runtime.
     * @param message The message object from the service worker.
     */
    const messageListener = (message: { type: string; payload: any }) => {
        if (message.type !== 'STREAM_UPDATE') {
            return;
        }

        const { messageId, chunk, isLast } = message.payload as StreamUpdatePayload;

        // Check if this is the first chunk for a new message stream.
        if (!streamUpdaters.has(messageId) && !isLast) {
            if (chatRef.value) {
                // Create a new message in the chat and get the function to update it.
                const updateFunction = chatRef.value.streamAiResponse(messageId);
                streamUpdaters.set(messageId, updateFunction);
                updateFunction(chunk);
            }
            return;
        }

        // If it's a subsequent chunk for an existing stream...
        const updateFunction = streamUpdaters.get(messageId);
        if (updateFunction) {
            // Update the message with the new chunk.
            if (chunk) {
                updateFunction(chunk);
            }

            // If this is the last chunk, clean up the updater function.
            if (isLast) {
                streamUpdaters.delete(messageId);
            }
        }
    };

    // Register the listener when the component mounts.
    onMounted(() => {
        chrome.runtime.onMessage.addListener(messageListener);
    });

    // Clean up the listener when the component unmounts to prevent memory leaks.
    onUnmounted(() => {
        chrome.runtime.onMessage.removeListener(messageListener);
    });
}
