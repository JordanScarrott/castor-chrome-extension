<template>
    <header class="app-header" role="banner">
        <CastorIcon class="header-icon" @click="handleIconClick" />
        <h1 class="header-title">Castor</h1>
    </header>
</template>

<script setup lang="ts">
import CastorIcon from "./CastorIcon.vue";
import { useSessionStore } from "@/popup/store/sessionStore";

const store = useSessionStore();

const handleIconClick = () => {
    store.resetSession();
};
</script>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
    flex-shrink: 0;
}

.header-icon {
    width: 24px;
    height: 24px;
    margin-right: 0.5rem;
    cursor: pointer;
}

.header-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}
</style>
