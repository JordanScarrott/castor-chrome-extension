<!-- In your App.vue -->
<template>
    <Chat
        ref="chatComponent"
        :is-loading="isLoading"
        :sample-questions="currentQuestions"
        @submit-question="handleQuestion"
    />
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
import { hotelNaturalLanguageQuestions } from "@/service-worker-2/handlers/hotelDataHandler";
import { ref } from "vue";

// 1. Give the component a name so you can call its methods
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

// 2. Control the loading state
const isLoading = ref(false);

// 3. Define the question chips directly
const currentQuestions = ref(hotelNaturalLanguageQuestions);

import { onMounted, onUnmounted } from "vue";

const streamHandlers = new Map<string, (chunk: string) => void>();

// 4. Listen for when the user asks a question
async function handleQuestion(questionText: string) {
    isLoading.value = true;
    try {
        // This is now a fire-and-forget call; the response will be handled by the stream listener
        await chrome.runtime.sendMessage({
            type: "PROCESS_QUESTION",
            payload: questionText,
        });
    } catch (error) {
        console.error("Failed to send question to service worker:", error);
        isLoading.value = false;
        // Optionally add an error message to the UI
        chatComponent.value?.streamAiResponse(Date.now())(
            "Sorry, I was unable to process your question."
        );
    }
}

const handleStreamUpdate = (message: any) => {
    if (message.type !== "STREAM_UPDATE") {
        return;
    }
    const { messageId, chunk, isLast } = message.payload;

    let handler = streamHandlers.get(messageId);

    // If it's the first chunk for this messageId, create a new message bubble
    if (!handler) {
        const streamUpdater = chatComponent.value?.streamAiResponse(messageId);
        if (!streamUpdater) {
            return;
        }
        handler = streamUpdater;
        streamHandlers.set(messageId, handler);
        isLoading.value = false;
    }

    // Append the new chunk
    if (chunk) {
        handler(chunk);
    }

    // If it's the last chunk, clean up the handler
    if (isLast) {
        streamHandlers.delete(messageId);
    }
};

onMounted(() => {
    chrome.runtime.onMessage.addListener(handleStreamUpdate);
});

onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleStreamUpdate);
});

function resetChat() {
    chatComponent.value?.clearChat();
}
</script>
