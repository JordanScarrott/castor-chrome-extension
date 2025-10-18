<template>
    <header class="app-header" role="banner">
        <CastorIcon class="header-icon" @click="handleIconClick" />
        <h1 class="header-title" @click="handleIconClick">Castor</h1>
    </header>
</template>

<script setup lang="ts">
import CastorIcon from "./CastorIcon.vue";
import { useSessionStore } from "../store/sessionStore";

const store = useSessionStore();

const handleIconClick = () => {
    store.resetSession();
};
</script>

<style scoped>
.app-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
    background-color: #ffffff;
    flex-shrink: 0;
}

.header-icon {
    width: 28px;
    height: 28px;
    margin-right: 0.5rem;
    cursor: pointer;
}

.header-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    cursor: pointer;
}
</style>
