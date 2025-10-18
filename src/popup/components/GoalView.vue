<template>
    <div class="goal-view-container">
        <h1 class="tagline">Lets browse the web better</h1>
        <form class="input-wrapper" @submit.prevent="handleGoalSubmission">
            <input
                v-model="goalInput"
                type="text"
                :placeholder="animatedPlaceholder"
                class="goal-input"
            />
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTypingAnimation } from "../composables/useTypingAnimation";
import { useSessionStore } from "../store/sessionStore";
import { useTabGroupManager } from "../composables/useTabGroupManager";
import { generateTabGroupTitle } from "@/utils/textUtils";

const store = useSessionStore();
const goalInput = ref("");
const { createTabGroup } = useTabGroupManager();

const goals = [
    "Find a hotel near the V&A Waterfront on a MyCiTi bus route.",
    "Compare Dell XPS 15 laptops for video editing.",
    "Shop for a 'get well soon' basket with local Cape Town treats.",
    "Observe console logs and find the bug on this page.",
];

const { currentPhrase: animatedPlaceholder } = useTypingAnimation(goals);

const handleGoalSubmission = async () => {
    if (goalInput.value.trim()) {
        const goalText = goalInput.value.trim();
        const tabGroupTitle = generateTabGroupTitle(goalText);
        const tabGroupId = await createTabGroup(tabGroupTitle);
        if (tabGroupId) {
            store.setGoal(goalText, tabGroupId);
        }
    }
};
</script>

<style scoped>
.goal-view-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: #f9fafb;
}

.tagline {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.5rem;
}

.input-wrapper {
    position: relative;
    width: 90%;
    max-width: 28rem;
    margin: 0;
}

.goal-input {
    width: 100%;
    background-color: #ffffff;
    color: #1f2937;
    border-radius: 9999px;
    padding: 1rem 1.5rem;
    border: 1px solid #d1d5db;
    transition: all 0.2s ease-in-out;
    box-sizing: border-box;
    height: 3.5rem;
    font-size: 1rem;
}

.goal-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    border-color: #3b82f6;
}

.goal-input::placeholder {
    color: #9ca3af;
}
</style>
