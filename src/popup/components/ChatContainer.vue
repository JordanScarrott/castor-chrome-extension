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

// --- DEMO LIFECYCLE FOR ANALYSIS CARD ---
// This is a stand-in for a real data stream from the service worker
function runAnalysisDemo() {
    const analysisId = `analysis-${Date.now()}`;
    const topic = "Hotels near the Eiffel Tower";

    // 1. Add the card
    chatComponent.value?.addAnalysisCard(analysisId, topic);

    // 2. Update it with "ideas"
    const ideas = [
        "Pullman Paris Tour Eiffel",
        "Mercure Paris Centre Tour Eiffel",
        "Shangri-La Hotel Paris",
        "Hôtel Le Derby Alma",
    ];

    let ideaIndex = 0;
    const interval = setInterval(() => {
        if (ideaIndex < ideas.length) {
            chatComponent.value?.updateAnalysisCard(analysisId, ideas[ideaIndex]);
            ideaIndex++;
        } else {
            // 3. Complete the analysis
            clearInterval(interval);
            chatComponent.value?.completeAnalysisCard(analysisId);
        }
    }, 1000);
}

onMounted(() => {
    runAnalysisDemo();
});

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
