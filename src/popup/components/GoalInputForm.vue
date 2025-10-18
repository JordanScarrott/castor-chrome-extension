<template>
    <form @submit.prevent="handleSubmit" class="input-form">
        <input
            v-model="goalText"
            type="text"
            :placeholder="placeholder"
            class="chat-input"
            :disabled="isLoading"
            required
        />
        <button
            type="submit"
            :disabled="!goalText.trim() || isLoading"
            class="send-btn"
        >
            <SendIcon :is-loading="isLoading" />
        </button>
    </form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import SendIcon from "./SendIcon.vue";
import { useTypingAnimation } from "../composables/useTypingAnimation";

defineProps<{
    isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-goal', goalText: string): void;
}>();

const goalText = ref('');

const handleSubmit = () => {
    if (goalText.value.trim()) {
        emit("submit-goal", goalText.value.trim());
    }
};

const { placeholder } = useTypingAnimation([
    "Compare Dell XPS 15 laptops for video editing",
    "Find the best noise-cancelling headphones under $300",
    "Plan a 3-day backpacking trip in Yosemite",
    "What are the highest-rated sci-fi books of the last decade?",
    "Explain the basics of quantum computing",
]);
</script>

<style scoped>
.input-form {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #ffffff;
    padding: 8px;
    border-radius: 9999px; /* Pill shape */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border: 1px solid #dcdfe2;
    transition: box-shadow 0.2s;
}
.input-form:focus-within {
    box-shadow: 0 0 0 2px #d2e3fc;
    border-color: #0b57d0;
}
.chat-input {
    flex: 1;
    border: none;
    box-shadow: none;
    padding: 12px;
    font-size: 14px;
    background-color: transparent;
    color: #3c4043;
    outline: none;
}
.chat-input::placeholder {
    color: #9ab0c9;
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
</style>
