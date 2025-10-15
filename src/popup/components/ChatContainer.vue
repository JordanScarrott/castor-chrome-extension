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
import { onMounted, ref } from "vue";

// 1. Give the component a name so you can call its methods
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

// 2. Control the loading state
const currentQuestions = ref(hotelNaturalLanguageQuestions);

import { useAiMessageStream } from "@/popup/composables/useAiMessageStream";

const { isLoading, startLoading, stopLoading } = useAiMessageStream(
    (messageId) => chatComponent.value?.streamAiResponse(messageId)
);

// 4. Listen for when the user asks a question
async function handleQuestion(questionText: string) {
    startLoading();
    try {
        // This is now a fire-and-forget call; the response will be handled by the stream listener
        await chrome.runtime.sendMessage({
            type: "PROCESS_QUESTION",
            payload: questionText,
        });
    } catch (error) {
        console.error("Failed to send question to service worker:", error);
        stopLoading();
        // Optionally add an error message to the UI
        chatComponent.value?.streamAiResponse(Date.now())(
            "Sorry, I was unable to process your question."
        );
    }
}

function resetChat() {
    chatComponent.value?.clearChat();
}
</script>
