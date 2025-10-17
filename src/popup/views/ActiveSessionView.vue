<template>
    <div class="active-session-container">
        <Header />
        <ChatContainer />
    </div>
</template>

<script setup lang="ts">
import ChatContainer from "@/popup/components/ChatContainer.vue";
import Header from "@/popup/components/Header.vue";
</script>

<style scoped>
.active-session-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
