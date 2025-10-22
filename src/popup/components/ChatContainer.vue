<!-- In your App.vue -->
<template>
    <div class="chat-view-container">
        <Chat
            ref="chatComponent"
            :is-loading="isLoading"
            :sample-questions="currentQuestions"
            @submit-question="handleQuestion"
        />
    </div>
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
import { hotelNaturalLanguageQuestions } from "@/service-worker-2/handlers/hotelDataHandler";
import { ref, watch } from "vue";
import { useSessionStore } from "@/popup/store/sessionStore";
import { useStorageManager } from "@/popup/composables/useStorageManager";

const chatComponent = ref<InstanceType<typeof Chat> | null>(null);
const sessionStore = useSessionStore();
const { useTabGroupChromeStorage } = useStorageManager(sessionStore.tabGroupId);

const analysisState = useTabGroupChromeStorage<any>("analysis", null);

watch(analysisState, (newState, oldState) => {
    if (!newState) return;

    if (!oldState || newState.analysisId !== oldState.analysisId) {
        chatComponent.value?.addAnalysisCard(newState.analysisId, newState.topic);
    }

    if (newState.ideas.length > (oldState?.ideas.length || 0)) {
        const newIdea = newState.ideas[newState.ideas.length - 1];
        chatComponent.value?.updateAnalysisCard(newState.analysisId, newIdea);
    }

    if (newState.status === "complete" && oldState?.status !== "complete") {
        chatComponent.value?.completeAnalysisCard(newState.analysisId);
        setTimeout(() => {
            analysisState.value = null;
        }, 100);
    }

    if (newState.status === "error" && oldState?.status !== "error") {
        const errorMessage = newState.ideas[newState.ideas.length - 1] || "An unknown error occurred.";
        chatComponent.value?.updateAnalysisCard(newState.analysisId, errorMessage);
        chatComponent.value?.completeAnalysisCard(newState.analysisId);
        setTimeout(() => {
            analysisState.value = null;
        }, 100);
    }
});

// 2. Control the loading state
const currentQuestions = ref(hotelNaturalLanguageQuestions);

import { useAiMessageStream } from "@/popup/composables/useAiMessageStream";
import { useChromeStorage } from "@/popup/composables/useChromeStorage";

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
        chatComponent.value?.streamAiResponse(Date.now() + "")(
            "Sorry, I was unable to process your question."
        );
    }
}

function resetChat() {
    chatComponent.value?.clearChat();
}
</script>

<style scoped>
.chat-view-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}
</style>
