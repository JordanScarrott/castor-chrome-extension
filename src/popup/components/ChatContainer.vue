<!-- In your App.vue -->
<template>
    <div class="chat-view-container">
        <Chat
            ref="chatComponent"
            :is-loading="isLoading"
            :sample-questions="currentQuestions"
            :tab-group-id="props.tabGroupId"
            @submit-question="handleQuestion"
        />
    </div>
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
import { hotelNaturalLanguageQuestions } from "@/service-worker-2/handlers/hotelDataHandler";
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
    tabGroupId: number | null;
}>();

// 1. Give the component a name so you can call its methods
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

// useAnalysisDemo(chatComponent);
// const mangleFacts = useChromeStorage<string[]>("mangle_facts", []); // For accessing the mangle facts from local storage

const handleMessage = (message: any) => {
    if (!message.type || !message.payload || !message.payload.analysisId)
        return;

    switch (message.type) {
        case "START_ANALYSIS":
            chatComponent.value?.addAnalysisCard(
                message.payload.analysisId,
                message.payload.topic
            );
            break;
        case "ADD_ANALYSIS_IDEA":
            chatComponent.value?.updateAnalysisCard(
                message.payload.analysisId,
                message.payload.idea
            );
            break;
        case "COMPLETE_ANALYSIS":
            chatComponent.value?.completeAnalysisCard(
                message.payload.analysisId
            );
            break;
    }
};

onMounted(() => {
    chrome.runtime.onMessage.addListener(handleMessage);
});

onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleMessage);
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
