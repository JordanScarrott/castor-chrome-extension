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
import { ref } from "vue";

// 1. Give the component a name so you can call its methods
const chatComponent = ref<InstanceType<typeof Chat> | null>(null);

// 2. Control the loading state
const isLoading = ref(false);

// 3. Control the question chips
const currentQuestions = ref([
    "Which hotels have the highest rating?",
    "What are the best value options?",
    "Which hotel has the best location?",
]);

// 4. Listen for when the user asks a question
async function handleQuestion(questionText: string) {
    // A. Show the loading indicator
    isLoading.value = true;

    // B. Send the question to your background script for processing
    //    (This is where you'd call your Mangle/Gemini logic)
    const aiResponseText = await getAiResponse(questionText);

    // C. Turn off the loading indicator
    isLoading.value = false;

    // D. Start streaming the AI's response back to the component
    const streamUpdater = chatComponent.value?.streamAiResponse(Date.now());
    if (streamUpdater) {
        // Simulate streaming by feeding chunks of the response
        for (const char of aiResponseText) {
            streamUpdater(char);
            await new Promise((r) => setTimeout(r, 20)); // fake delay
        }
    }
}

// Dummy function to simulate getting a response
async function getAiResponse(question: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 1500));
    return `You asked: "${question}". Here is a simulated response from the AI.`;
}

// You can also call the component's public methods whenever you want
function resetChat() {
    chatComponent.value?.clearChat();
}
</script>
