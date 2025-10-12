<template>
    <div>
        <button @click="analyse">Analyse</button>
        output: {{ output }}
    </div>
</template>

<script setup lang="ts">
import { useContentStore } from "@/service-worker-2/stores/contentStore";
import { ref, onMounted, onUnmounted } from "vue";

const output = ref<
    {
        question: string;
        answer: any;
    }[]
>();
async function analyse(): Promise<void> {
    // output.value = await useContentStore().analyseHotelInfo();
}

interface AnalysisResult {
    question: string;
    answer: any[] | null;
}

const results = ref<AnalysisResult[] | null>(null);
const loading = ref(true);

// The listener function that will handle incoming live updates
const messageListener = (message: any) => {
    if (message.type === "ANALYSIS_UPDATED") {
        console.log("Popup received live analysis update:", message.payload);
        results.value = message.payload;
        if (loading.value) loading.value = false;
    }
};

onMounted(() => {
    // 1. Add a listener for live updates from the background script
    chrome.runtime.onMessage.addListener(messageListener);

    // 2. Request the most recent data when the popup opens
    chrome.runtime.sendMessage({ type: "GET_LATEST_ANALYSIS" }, (response) => {
        // Check for errors, which can happen if the background script is not ready
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
        } else if (response) {
            console.log("Popup received initial analysis data:", response);
            results.value = response;
        }
        loading.value = false;
    });
});

onUnmounted(() => {
    // Clean up the listener when the popup closes to prevent memory leaks
    chrome.runtime.onMessage.removeListener(messageListener);
});
</script>

<!-- <style scoped>

</style> -->
