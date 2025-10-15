<template>
    <div class="chat-container">
        <!-- Header -->
        <div class="chat-header">
            <div class="header-logo-container">
                <svg
                    class="header-logo"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M12,1L9,9L1,12L9,15L12,23L15,15L23,12L15,9L12,1Z"
                    />
                </svg>
                <svg
                    class="header-logo small"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M12,6.5L13.5,10L17,11.5L13.5,13L12,16.5L10.5,13L7,11.5L10.5,10L12,6.5Z"
                    />
                </svg>
            </div>
            <h1 class="header-title">Castor</h1>
        </div>

        <!-- Message History -->
        <div ref="messageContainer" class="message-history">
            <!-- Existing Messages -->
            <div
                v-for="message in messages"
                :key="message.id"
                class="message-wrapper"
                :class="
                    message.sender === 'user'
                        ? 'user-message-wrapper'
                        : 'ai-message-wrapper'
                "
            >
                <div class="message-bubble">
                    <p>{{ message.text }}</p>
                </div>
            </div>
            <!-- Loading Indicator -->
            <div
                v-if="props.isLoading"
                class="message-wrapper ai-message-wrapper"
            >
                <div class="message-bubble">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Action Toolbar & Input Area -->
        <div class="input-area" :class="{ 'disabled-input': props.isLoading }">
            <!-- Guiding Question Chips -->
            <HorizontalScroller class="chip-container">
                <button
                    v-for="question in props.sampleQuestions"
                    :key="question"
                    @click="() => handleQuestionChipClick(question)"
                    class="chip"
                    :disabled="props.isLoading"
                >
                    {{ question }}
                </button>
            </HorizontalScroller>

            <!-- Text Input and Send Button -->
            <form @submit.prevent="handleSubmit" class="input-form">
                <button
                    type="button"
                    @click="handleAttachClick"
                    :disabled="props.isLoading"
                    class="send-btn"
                >
                    <svg
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                    </svg>
                </button>
                <input
                    v-model="userInput"
                    type="text"
                    placeholder="Type your message here..."
                    class="chat-input"
                    :disabled="props.isLoading"
                />
                <button
                    type="submit"
                    :disabled="!userInput.trim() || props.isLoading"
                    class="send-btn"
                >
                    <svg
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        ></path>
                    </svg>
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { usePageAttachment } from "../composables/usePageAttachment";
import { useMessageStreamer } from "../composables/useMessageStreamer";
import HorizontalScroller from "./HorizontalScroller.vue";

// --- TYPE DEFINITIONS ---
interface Message {
    id: number | string;
    text: string;
    sender: "user" | "ai";
}

interface Props {
    sampleQuestions?: string[];
    isLoading?: boolean;
}

// --- PROPS ---
const props = withDefaults(defineProps<Props>(), {
    sampleQuestions: () => [
        "Which hotels have the highest rating?",
        "Show me hotels with a pool.",
    ],
    isLoading: false,
});

// --- EMITS ---
const emit = defineEmits<{
    (e: "submit-question", questionText: string): void;
}>();

// --- STATE MANAGEMENT ---
const messages = ref<Message[]>([]);
const userInput = ref("");
const messageContainer = ref<HTMLElement | null>(null);
const nextId = ref(0);

// --- COMPOSABLES ---
const { attachFromPage } = usePageAttachment();

// --- METHODS ---
const handleAttachClick = () => {
    attachFromPage();
};
const scrollToBottom = () => {
    nextTick(() => {
        if (messageContainer.value) {
            messageContainer.value.scrollTop =
                messageContainer.value.scrollHeight;
        }
    });
};

const addMessage = (text: string, sender: "user" | "ai") => {
    const newMessage: Message = {
        id: nextId.value++,
        text,
        sender,
    };
    messages.value.push(newMessage);
    scrollToBottom();
    return newMessage;
};

const handleSubmit = () => {
    if (props.isLoading) return;
    const text = userInput.value.trim();
    if (!text) return;

    addMessage(text, "user");
    emit("submit-question", text);
    userInput.value = "";
};

const handleQuestionChipClick = (question: string) => {
    if (props.isLoading) return;
    addMessage(question, "user");
    emit("submit-question", question);
};

const clearChat = () => {
    messages.value = [];
    nextId.value = 0;
};

// --- EXPOSED METHOD for STREAMING AI RESPONSE ---
const streamAiResponse = (messageId: string) => {
    const newMessage: Message = {
        id: messageId,
        text: "", // Start with empty text
        sender: "ai",
    };
    messages.value.push(newMessage);
    scrollToBottom();

    const updateFunction = (textChunk: string) => {
        const messageIndex = messages.value.findIndex(
            (m) => m.id === messageId
        );
        if (messageIndex !== -1) {
            messages.value[messageIndex].text += textChunk;
            scrollToBottom();
        }
    };

    return updateFunction;
};

// --- COMPONENT API and STREAMING LOGIC ---
const chatApi = { streamAiResponse };
const chatApiRef = ref(chatApi);
// useMessageStreamer(chatApiRef);

defineExpose({
    streamAiResponse,
    clearChat,
});
</script>

<style scoped>
/* Main container setup */
.chat-container {
    display: flex;
    flex-direction: column;
    height: 600px;
    max-height: 600px; /* Standard extension popup max height */
    background-color: #f0f4f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif;
    color: #3c4043;
}

/* Header Styles */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: center; /* Center-aligns the content */
    padding: 12px 16px;
    background-color: #ffffff; /* Fallback color */
    border-bottom: 1px solid #dcdfe2;
    flex-shrink: 0;
}
.header-logo-container {
    display: flex;
    align-items: center;
    gap: 2px;
}
.header-logo {
    width: 24px;
    height: 24px;
    color: #0b57d0;
}
.header-logo.small {
    width: 22px; /* Increased size by ~35% */
    height: 22px;
}
.header-title {
    margin-left: 10px;
    font-size: 18px;
    font-weight: 600;
}

/* Message History */
.message-history {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.message-wrapper {
    display: flex;
}
.user-message-wrapper {
    justify-content: flex-end;
}
.ai-message-wrapper {
    justify-content: flex-start;
}
.message-bubble {
    max-width: 80%;
    padding: 10px 14px;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    word-wrap: break-word;
}
.user-message-wrapper .message-bubble {
    background-color: #0b57d0;
    color: white;
    border-bottom-right-radius: 4px;
}
.ai-message-wrapper .message-bubble {
    background-color: #ffffff;
    color: #3c4043;
    border-bottom-left-radius: 4px;
}
.message-bubble p {
    margin: 0;
    white-space: pre-wrap;
}

/* Input Area */
.input-area {
    flex-shrink: 0;
    padding: 16px;
    background-color: #ffffff; /* Adds contrast */
    border-top: 1px solid #dcdfe2;
    transition: opacity 0.3s;
}

.input-area.disabled-input {
    opacity: 0.5;
    pointer-events: none;
}

.chip-container {
    margin-bottom: 12px;
}

.chip {
    flex-shrink: 0;
    background-color: #ffffff;
    border: 1px solid #c0c6cc; /* Increased border contrast */
    color: #3c4043;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 12px;
    border-radius: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
}
.chip:hover {
    background-color: #e8f0fe;
    border-color: #c9deff;
}

.input-form {
    display: flex;
    align-items: center;
    gap: 8px;
}

.chat-input {
    flex: 1;
    border: 1px solid #dcdfe2;
    border-radius: 8px;
    box-shadow: none;
    padding: 12px;
    font-size: 14px;
    background-color: #ffffff;
}
.chat-input:focus {
    outline: none;
    border-color: #0b57d0;
    box-shadow: 0 0 0 2px #d2e3fc;
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
.send-icon {
    width: 24px;
    height: 24px;
    transform: rotate(90deg);
}
.input-form .send-btn[type="button"] .send-icon {
    transform: rotate(0deg);
}

/* Typing Indicator Styles */
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 0;
}

.typing-indicator span {
    height: 8px;
    width: 8px;
    background-color: #9ab0c9;
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
