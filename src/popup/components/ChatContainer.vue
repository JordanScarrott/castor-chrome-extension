<!-- In your App.vue -->
<template>
    <div class="chat-view-container">
        <Chat
            ref="chatComponent"
            :is-loading="isLoading"
            :sample-questions="sampleQuestions"
            :cross-site-query-map="crossSiteQueryMap"
            :should-animate-chips="shouldAnimateChips"
            :is-fetching-insights="isFetchingInsights"
            @submit-question="handleQuestion"
            @submit-mangle-query="handleMangleQuery"
            @submit-natural-language-question="handleNaturalLanguageQuestion"
        />
    </div>
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
import { hotelNaturalLanguageQuestions } from "@/service-worker-2/handlers/hotelDataHandler";
import { ref, watch, onMounted } from "vue";
import { useSessionStore } from "@/popup/store/sessionStore";
import { useStorageManager } from "@/popup/composables/useStorageManager";

const chatComponent = ref<InstanceType<typeof Chat> | null>(null);
const sessionStore = useSessionStore();
const { useTabGroupChromeStorage, useTabGroupStorage } = useStorageManager(
    sessionStore.tabGroupId
);

const analysisState = useTabGroupChromeStorage<any>("analysis", null);
const crossSiteQueryMap = ref<Record<string, string>>({});
const shouldAnimateChips = ref(false);
const isFetchingInsights = ref(false);

// Use local storage for the translated queries
const translatedQueries = useTabGroupStorage<Record<string, string>>(
    "translated_queries",
    {}
);

watch(analysisState, (newState, oldState) => {
    if (!newState) return;

    if (
        !chatComponent.value?.hasAnalysisCard(newState.analysisId) &&
        (!oldState || newState.analysisId !== oldState.analysisId)
    ) {
        chatComponent.value?.addAnalysisCard(
            newState.analysisId,
            newState.topic
        );
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
        const errorMessage =
            newState.ideas[newState.ideas.length - 1] ||
            "An unknown error occurred.";
        chatComponent.value?.updateAnalysisCard(
            newState.analysisId,
            errorMessage
        );
        chatComponent.value?.completeAnalysisCard(newState.analysisId);
        setTimeout(() => {
            analysisState.value = null;
        }, 100);
    }
});

// 2. Control the loading state
const sampleQuestions = ref(hotelNaturalLanguageQuestions);

import { useAiMessageStream } from "@/popup/composables/useAiMessageStream";
import { useChromeStorage } from "@/popup/composables/useChromeStorage";

const { isLoading, startLoading, stopLoading } = useAiMessageStream(
    (messageId) => chatComponent.value?.streamAiResponse(messageId)
);

onMounted(async () => {
    const animateQueries = (queries: Record<string, string>) => {
        const queryEntries = Object.entries(queries);
        let i = 0;
        const interval = setInterval(() => {
            if (i < queryEntries.length) {
                const [key, value] = queryEntries[i];
                crossSiteQueryMap.value = {
                    ...crossSiteQueryMap.value,
                    [key]: value,
                };
                i++;
            } else {
                clearInterval(interval);
                isFetchingInsights.value = false; // Animation finished
            }
        }, 500); // 0.5-second delay between each chip
    };

    // Check if the queries are already in local storage
    if (Object.keys(translatedQueries.value).length > 0) {
        // If queries are cached, show them without animation
        crossSiteQueryMap.value = translatedQueries.value;
        shouldAnimateChips.value = false;
    } else {
        // If not, fetch them from the service worker and animate them
        isFetchingInsights.value = true;
        try {
            const queries = await chrome.runtime.sendMessage({
                type: "TRANSLATE_QUERIES",
            });
            translatedQueries.value = queries; // Save to local storage
            animateQueries(queries);
            shouldAnimateChips.value = true;
        } catch (error) {
            console.error("Failed to fetch translated queries:", error);
            isFetchingInsights.value = false;
        }
    }
});

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

async function handleMangleQuery(query: string) {
    startLoading();
    try {
        const question = crossSiteQueryMap.value[query];
        await chrome.runtime.sendMessage({
            type: "EXECUTE_MANGLE_QUERY",
            payload: { query, question, tabGroupId: sessionStore.tabGroupId },
        });
    } catch (error) {
        console.error("Failed to execute Mangle query:", error);
        stopLoading();
        chatComponent.value?.streamAiResponse(Date.now() + "")(
            "Sorry, I encountered an error while running the query."
        );
    }
}

async function handleNaturalLanguageQuestion(question: string) {
    startLoading();
    try {
        const matchedQuery = await chrome.runtime.sendMessage({
            type: "MATCH_QUESTION",
            payload: {
                question,
                queries: crossSiteQueryMap.value,
            },
        });

        if (matchedQuery) {
            handleMangleQuery(matchedQuery);
        } else {
            // Handle case where no match is found
            stopLoading();
            chatComponent.value?.streamAiResponse(Date.now() + "")(
                "Sorry, I'm unable to help with that right now."
            );
        }
    } catch (error) {
        console.error("Failed to match question:", error);
        stopLoading();
        chatComponent.value?.streamAiResponse(Date.now() + "")(
            "Sorry, I encountered an error while matching your question."
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
