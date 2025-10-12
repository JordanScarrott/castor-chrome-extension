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

// 4. Listen for when the user asks a question
async function handleQuestion(questionText: string) {
    isLoading.value = true;

    // Send the full question text to the service worker for processing
    const aiResponseText = await getResponse(questionText);
    isLoading.value = false;

    const streamUpdater = chatComponent.value?.streamAiResponse(Date.now());
    if (streamUpdater) {
        for (const char of aiResponseText) {
            streamUpdater(char);
            await new Promise((r) => setTimeout(r, 20)); // Simulate stream delay
        }
    }
}

// Unified function to get a response from the service worker
async function getResponse(question: string): Promise<string> {
    const isMangleQuestion = !!currentQuestions.value.find(
        (q) => q === question
    );

    if (isMangleQuestion) {
        // This is a known question, send it to the service worker
        try {
            const response = await chrome.runtime.sendMessage({
                type: "PROCESS_QUESTION", // A single, clear message type
                payload: question,
            });
            console.log("🚀 ~ getResponse ~ response:", response);

            if (!response) {
                console.error(
                    "No response from service worker. It may not have sent one."
                );
                return "Sorry, I'm having trouble connecting to my brain right now.";
            }

            if (response.error) {
                console.error("Error from service worker:", response.error);
                return "Sorry, I encountered an error while analyzing the data.";
            }

            return response.response || "I couldn't find an answer for that.";
        } catch (error) {
            console.error("Failed to send message to service worker:", error);
            return "There was a communication error with the background service.";
        }
    } else {
        // This is a custom question, return the learning message
        await new Promise((r) => setTimeout(r, 750)); // Simulate thinking
        return "Sorry, I'm still learning how to answer that at the moment.";
    }
}

function resetChat() {
    chatComponent.value?.clearChat();
}
</script>
