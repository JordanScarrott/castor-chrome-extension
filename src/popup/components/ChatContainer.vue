<!-- In your App.vue -->
<template>
    <Chat
        ref="chatComponent"
        :is-loading="isLoading"
        :messages="messages"
        :sample-questions="currentQuestions"
        @submit-question="handleQuestion"
    />
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
import { hotelNaturalLanguageQuestions } from "@/service-worker-2/handlers/hotelDataHandler";
import { onMounted, ref, onUnmounted, computed } from "vue";
import { db } from "@/db";
import { useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { useSessionStore } from "@/popup/store/sessionStore";

const store = useSessionStore();

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
            chatComponent.value?.updateAnalysisCard(
                analysisId,
                ideas[ideaIndex]
            );
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

// 1. Give the component a name so you can call its methods
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

const messages = useObservable(
  liveQuery(() => {
    if (store.currentConversationId) {
      return db.messages
        .where("conversationId")
        .equals(store.currentConversationId)
        .toArray();
    }
    return [];
  })
);

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

const { isLoading, startLoading, stopLoading } = useAiMessageStream(
    () => {} // This is now handled by the database
);

// 4. Listen for when the user asks a question
async function handleQuestion(questionText: string) {
    startLoading();
    try {
        if (!store.currentConversationId) {
            await store.createConversation(questionText);
        }

        await db.messages.add({
            conversationId: store.currentConversationId!,
            role: 'user',
            content: questionText,
            timestamp: new Date(),
            isStreaming: false,
        });

        // This is now a fire-and-forget call; the response will be handled by the stream listener
        await chrome.runtime.sendMessage({
            type: "PROCESS_QUESTION",
            payload: {
                question: questionText,
                conversationId: store.currentConversationId!,
            },
        });
    } catch (error) {
        console.error("Failed to send question to service worker:", error);
        stopLoading();
    }
}
</script>
