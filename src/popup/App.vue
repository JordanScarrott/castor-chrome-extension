<template>
    <div id="app-container">
        <component :is="activeView" />
    </div>
</template>

<script setup lang="ts">
import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import { computed, onMounted, onUnmounted } from "vue";
import { useSessionStore } from "./store/sessionStore";
import ActiveSessionView from "./views/ActiveSessionView.vue";
import NewSessionView from "./views/NewSessionView.vue";

const store = useSessionStore();

// Conditionally render the view based on whether a goal has been set
const activeView = computed(() => {
    return store.hasActiveSession ? ActiveSessionView : NewSessionView;
    // return NewSessionView;
});

// Initialize the session title when the component mounts
const tabActivationListener = async (activeInfo: chrome.tabs.TabActiveInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    store.loadSessionForTabGroup(tab.groupId);
};

onMounted(async () => {
    const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (currentTab) {
        store.loadSessionForTabGroup(currentTab.groupId);
    }

    chrome.tabs.onActivated.addListener(tabActivationListener);

    geminiNanoService.primeGeminiNano();
});

onUnmounted(() => {
    chrome.tabs.onActivated.removeListener(tabActivationListener);
});
</script>

<style>
/* Basic styles for the popup window */
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif;
    width: 400px; /* Typical width for a Chrome extension popup */
}

#app-container {
    height: 500px; /* Fixed height for the popup */
    display: flex;
    flex-direction: column;
}
</style>
