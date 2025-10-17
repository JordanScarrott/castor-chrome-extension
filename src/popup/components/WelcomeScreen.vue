<template>
    <div class="welcome-container" :class="{ 'animate-start': startAnimation }">
        <div class="animation-wrapper">
            <h1 class="castor-title">Castor</h1>
            <CastorIcon class="spark-icon" :loading="isTwinkling" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import CastorIcon from "./CastorIcon.vue";

const emit = defineEmits(["animation-complete"]);

const startAnimation = ref(false);
const isTwinkling = ref(false);

onMounted(() => {
    const initialDelay = 100; // ms
    const animationDuration = 2500; // ms, matches --animation-total-duration

    // Start the main animation and twinkling
    setTimeout(() => {
        startAnimation.value = true;
        isTwinkling.value = true;
    }, initialDelay);

    // Stop twinkling when the expand animation begins
    setTimeout(() => {
        isTwinkling.value = false;
    }, initialDelay + animationDuration * 0.6);

    // Emit event when the entire animation is over
    setTimeout(() => {
        emit("animation-complete");
    }, animationDuration);
});
</script>

<style scoped>
.welcome-container {
    --animation-total-duration: 2.5s; /* Master variable for animation timing */
    background-color: #f9fafb; /* bg-gray-50 */
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: background-color calc(var(--animation-total-duration) * 0.2)
        ease;
}

.animation-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform-origin: center;
}

.spark-icon {
    width: 36px;
    height: 36px;
}

.castor-title {
    font-size: 2rem; /* 32px */
    font-weight: 700;
    color: #111827; /* gray-900 */
    margin-bottom: 1rem; /* 16px */
    opacity: 0;
}

.welcome-container.animate-start {
    background-color: #f9fafb; /* bg-gray-50 */
}

/* Animation sequence */
.welcome-container.animate-start .castor-title {
    animation: fade-in-out calc(var(--animation-total-duration) * 0.6)
        cubic-bezier(0.4, 0, 0.2, 1) forwards
        calc(var(--animation-total-duration) * 0.1);
}

.welcome-container.animate-start .animation-wrapper {
    animation: expand calc(var(--animation-total-duration) * 0.4)
        cubic-bezier(0.4, 0, 0.2, 1) forwards
        calc(var(--animation-total-duration) * 0.6);
}

.welcome-container.animate-start .spark-icon {
    /* Twinkling is now controlled by a prop, so no delay is needed here */
}

@keyframes fade-in-out {
    0% {
        opacity: 0;
        transform: translateY(10px);
    }
    25%,
    75% {
        opacity: 1;
        transform: translateY(0);
    }
    100% {
        opacity: 0;
        transform: translateY(-5px);
    }
}

@keyframes expand {
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(100);
        opacity: 0;
    }
}

@keyframes fade-in-content {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

</style>
