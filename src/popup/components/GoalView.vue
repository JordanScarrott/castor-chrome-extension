<template>
    <div class="goal-view-container">
        <!-- <h1 class="tagline">Let's browse the web better</h1> -->
        <h1 class="tagline">Turn browsing into insight</h1>
        <form class="input-wrapper" @submit.prevent="handleGoalSubmission">
            <textarea
                v-model="goalInput"
                :placeholder="animatedPlaceholder"
                class="goal-input"
                :disabled="isLoading"
                rows="2"
            ></textarea>
            <div class="button-container">
                <button type="button" class="upload-btn" disabled>
                    <PaperclipIcon />
                </button>
                <button
                    type="submit"
                    :disabled="!goalInput.trim() || isLoading"
                    class="send-btn"
                >
                    <SendIcon :is-loading="isLoading" />
                </button>
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTypingAnimation } from "../composables/useTypingAnimation";
import { useSessionStore } from "../store/sessionStore";
import { useTabGroupManager } from "../composables/useTabGroupManager";
import { generateTabGroupTitleWithNano } from "@/utils/textUtils";
import SendIcon from "./SendIcon.vue";
import PaperclipIcon from "./PaperclipIcon.vue";

const store = useSessionStore();
const goalInput = ref("");
const isLoading = ref(false);
const { createTabGroup } = useTabGroupManager();

const goals = [
    "Find a hotel near the V&A Waterfront on a MyCiTi bus route.",
    "Compare Dell XPS 15 laptops for video editing.",
    "Shop for a 'get well soon' basket with local Cape Town treats.",
    "Observe console logs and find the bug on this page.",
];

const { currentPhrase: animatedPlaceholder } = useTypingAnimation(goals);

const handleGoalSubmission = async () => {
    if (goalInput.value.trim() && !isLoading.value) {
        isLoading.value = true;
        try {
            const goalText = goalInput.value.trim();
            const tabGroupTitle = await generateTabGroupTitleWithNano(goalText);
            const tabGroupId = await createTabGroup(tabGroupTitle);
            if (tabGroupId) {
                store.setGoal(goalText, tabGroupId);
            }
        } catch (error) {
            console.error("Error setting goal:", error);
            // Optionally, show an error message to the user
        } finally {
            isLoading.value = false;
        }
    }
};
</script>

<style scoped>
.goal-view-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2.5rem 1rem 2rem;
    background-color: #f9fafb;
}

.tagline {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.5rem;
}

.input-wrapper {
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    padding: 16px 16px 12px 16px;
    border-radius: 24px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #dcdfe2;
    transition: box-shadow 0.2s;
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
}
.input-wrapper:focus-within {
    box-shadow: 0 0 0 2px #d2e3fc;
    border-color: #0b57d0;
}
.goal-input {
    flex: 1;
    border: none;
    box-shadow: none;
    padding: 4px;
    font-size: 14px;
    background-color: transparent;
    color: #3c4043;
    outline: none;
    resize: none;
    font-family: inherit;
}
.goal-input::placeholder {
    color: #9ab0c9;
}
.button-container {
    display: flex;
    justify-content: space-between;
    width: 100%;
    align-items: center;
}
.upload-btn {
    padding: 8px;
    border-radius: 50%;
    background-color: transparent;
    color: #9ab0c9;
    border: none;
    cursor: not-allowed;
    display: flex;
    align-items: center;
    justify-content: center;
}
.send-btn {
    padding: 8px;
    border-radius: 50%;
    background-color: #0b57d0;
    color: white;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}
.send-btn:hover {
    background-color: #0a4cb0;
}
.send-btn:disabled {
    background-color: #b3c9e6;
    cursor: not-allowed;
}

.goal-input::placeholder {
    color: #9ca3af;
}
</style>
