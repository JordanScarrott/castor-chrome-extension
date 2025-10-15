<template>
    <div id="app-container">
        <component :is="activeView" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useSessionStore } from "./store/sessionStore";
import NewSessionView from "./views/NewSessionView.vue";
import ActiveSessionView from "./views/ActiveSessionView.vue";

const store = useSessionStore();

// Conditionally render the view based on whether a goal has been set
const activeView = computed(() => {
    return store.hasActiveSession ? ActiveSessionView : NewSessionView;
});

// Initialize the session title when the component mounts
onMounted(() => {
    store.initSession("My Research Session");
});
</script>

<style>
/* Basic styles for the popup window */
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif;
    width: 400px; /* Typical width for a Chrome extension popup */
    border-radius: 12px;
    overflow: hidden;
}

#app-container {
    min-height: 500px; /* Typical min-height for a content-rich popup */
    display: flex;
    flex-direction: column;
}
</style>
