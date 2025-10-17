<template>
    <div class="welcome-container" :class="{ 'animate-start': startAnimation }">
        <div class="animation-wrapper">
            <h1 class="castor-title">Castor</h1>
            <CastorIcon class="spark-icon" :loading="isTwinkling" />
        </div>
        <div class="content">
            <h1>Lets browse the web better</h1>
            <form class="input-wrapper" @submit.prevent="handleGoalSubmission">
                <input
                    v-model="goalInput"
                    type="text"
                    :placeholder="animatedPlaceholder"
                    class="goal-input"
                />
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTypingAnimation } from "../composables/useTypingAnimation";
import { useSessionStore } from "../store/sessionStore";
import CastorIcon from "./CastorIcon.vue";

const store = useSessionStore();
const goalInput = ref("");

const goals = [
    "Find a hotel near the V&A Waterfront on a MyCiTi bus route.",
    "Compare Dell XPS 15 laptops for video editing.",
    "Shop for a 'get well soon' basket with local Cape Town treats.",
    "Observe console logs and find the bug on this page.",
];

const { currentPhrase: animatedPlaceholder } = useTypingAnimation(goals);

const startAnimation = ref(false);
const isTwinkling = ref(false);

const handleGoalSubmission = () => {
    if (goalInput.value.trim()) {
        store.setGoal(goalInput.value.trim());
    }
};

onMounted(() => {
    const initialDelay = 100; // ms
    const totalDuration = 2500; // ms, matches --animation-total-duration

    setTimeout(() => {
        startAnimation.value = true;
        isTwinkling.value = true;
    }, initialDelay);

    // Stop twinkling when the expand animation begins
    // Delay is 0.6 * totalDuration
    setTimeout(() => {
        isTwinkling.value = false;
    }, initialDelay + totalDuration * 0.6);
});
</script>

<style scoped>
.welcome-container {
    --animation-total-duration: 2.5s; /* Master variable for animation timing */
    background-color: transparent;
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
    color: #f3f4f6; /* text-gray-100 */
    margin-bottom: 1rem; /* 16px */
    opacity: 0;
}

.welcome-container.animate-start {
    background-color: #111827; /* bg-gray-900 */
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

.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    opacity: 0;
    width: 100%;
    height: 100%;
    animation: fade-in-content calc(var(--animation-total-duration) * 0.4)
        ease-in-out forwards calc(var(--animation-total-duration) * 0.7);
}

h1 {
    font-size: 1.5rem; /* 24px */
    font-weight: 700;
    color: #f3f4f6; /* text-gray-100 */
    margin-bottom: 1.5rem; /* 24px */
}

.input-wrapper {
    position: relative;
    width: 90%;
    max-width: 28rem; /* 448px */
    margin: 0;
}

.goal-input {
    width: 100%;
    background-color: #1f2937; /* bg-gray-800 */
    color: white;
    border-radius: 9999px;
    padding: 1rem 1.5rem;
    border: 1px solid transparent;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;
    height: 3.5rem;
    font-size: 1rem;
}

.goal-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 */
}

.goal-input::placeholder {
    color: #6b7280; /* text-gray-500 */
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
