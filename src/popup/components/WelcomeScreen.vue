<template>
    <div class="welcome-container" :class="{ 'animate-start': startAnimation }">
        <div class="spark-icon-wrapper">
            <CastorIcon class="spark-icon" />
        </div>
        <div class="content" :class="{ 'fade-in': showContent }">
            <h1>Lets browse the web better</h1>
            <form class="input-wrapper" @submit.prevent="handleGoalSubmission">
                <input
                    v-model="goalInput"
                    type="text"
                    :placeholder="animatedPlaceholder"
                    class="goal-input"
                />
                <!-- <span class="cursor"></span> -->
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
const showContent = ref(false);

const handleGoalSubmission = () => {
    if (goalInput.value.trim()) {
        store.setGoal(goalInput.value.trim());
    }
};

onMounted(() => {
    setTimeout(() => {
        startAnimation.value = true;
    }, 100);

    setTimeout(() => {
        showContent.value = true;
    }, 1100); // Should be timed with the expand animation
});
</script>

<style scoped>
.welcome-container {
    background-color: transparent;
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition: background-color 0.5s ease;
}

.spark-icon-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: center;
    animation: pulse 1s ease-in-out;
}

.spark-icon {
    width: 36px;
    height: 36px;
    animation: pulse-inner 1s ease-in-out;
}

.welcome-container.animate-start {
    background-color: #111827; /* bg-gray-900 */
}

.welcome-container.animate-start .spark-icon-wrapper {
    animation: expand 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s;
}

.welcome-container.animate-start .spark-icon {
    animation: none;
}

.content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
    width: 100%;
    height: 100%;
}

.content.fade-in {
    opacity: 1;
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

@keyframes pulse {
    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }
    50% {
        transform: scale(1.2);
        opacity: 0.8;
    }
}

@keyframes pulse-inner {
    0%,
    100% {
        filter: drop-shadow(0 0 2px #fbbf24); /* yellow-300 */
    }
    50% {
        filter: drop-shadow(0 0 10px #fbbf24);
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

@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
}
</style>
