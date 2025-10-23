<template>
    <div v-if="isLoading" class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
    </div>
    <svg
        v-else
        class="send-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 19V5m-7 7l7-7 7 7"
        ></path>
    </svg>
</template>

<script setup lang="ts">
defineProps<{
    isLoading?: boolean;
}>();
</script>

<style scoped>
.send-icon {
    width: 24px;
    height: 24px;
    transform: rotate(90deg);
}

.typing-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;
    width: 24px;
}

.typing-indicator span {
    height: 6px;
    width: 6px;
    background-color: #ffffff;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes bounce {
    0%,
    80%,
    100% {
        transform: scale(0);
    }
    40% {
        transform: scale(1);
    }
}
</style>
