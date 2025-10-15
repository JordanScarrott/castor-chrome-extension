<!-- src/components/CastorIcon.vue -->
<template>
    <div class="icon-container" :class="{ loading: loading }">
        <svg class="header-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z" />
        </svg>
        <svg class="header-logo small" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,6.5L13.5,10L17,11.5L13.5,13L12,16.5L10.5,13L7,11.5L10.5,10L12,6.5Z" />
        </svg>
    </div>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean }>();
</script>

<style scoped>
.icon-container {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #0b57d0;
}
.header-logo { width: 20px; height: 20px; }
.header-logo.small { width: 18px; height: 18px; }

/* Twinkle Animation */
.loading .header-logo {
    animation: twinkle 1.5s infinite ease-in-out;
}
.loading .header-logo.small {
    animation-delay: -0.75s; /* Offset the animation */
}

@keyframes twinkle {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(0.8); opacity: 0.6; }
}
</style>
