<template>
    <div class="active-session-container">
        <Header />
        <ChatContainer :tab-group-id="store.tabGroupId" />
    </div>
</template>

<script setup lang="ts">
import ChatContainer from "@/popup/components/ChatContainer.vue";
import Header from "@/popup/components/Header.vue";
import { useSessionStore } from "@/popup/store/sessionStore";

const store = useSessionStore();
</script>

<style scoped>
.active-session-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
