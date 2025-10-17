<template>
    <div class="chat-container">
        <!-- Message History -->
        <div ref="messageContainer" class="message-history">
            <!-- Existing Messages -->
            <div v-for="message in messages" :key="message.id">
                <div
                    v-if="message.type === 'analysis'"
                    class="message-wrapper ai-message-wrapper"
                >
                    <AnalysisCard :data="message.analysisData!" />
                </div>
                <div
                    v-else
                    class="message-wrapper"
                    :class="
                        message.sender === 'user'
                            ? 'user-message-wrapper'
                            : 'ai-message-wrapper'
                    "
                >
                    <div class="message-bubble">
                        <MarkdownStream
                            v-if="message.sender === 'ai'"
                            :stream="message.text!"
                        />
                        <p v-else>{{ message.text }}</p>
                    </div>
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
import { Message, usePersistedChat } from "@/popup/composables/usePersistChat";
import { nextTick, onMounted, ref } from "vue";
import { usePageAttachment } from "../composables/usePageAttachment";
import AnalysisCard from "./AnalysisCard.vue";
import CastorIcon from "./CastorIcon.vue";
import HorizontalScroller from "./HorizontalScroller.vue";
import MarkdownStream from "./MarkdownStream.vue";

// --- TYPE DEFINITIONS ---

interface Props {
    sampleQuestions?: string[];
    isLoading?: boolean;
    tabGroupId: number | null;
}

// --- PROPS ---
const props = withDefaults(defineProps<Props>(), {
    sampleQuestions: () => [
        "Which hotels have the highest rating?",
        "Show me hotels with a pool.",
    ],
    isLoading: false,
    tabGroupId: null,
});

// --- EMITS ---
const emit = defineEmits<{
    (e: "submit-question", questionText: string): void;
}>();

// --- STATE MANAGEMENT ---
const { messages, nextId } = usePersistedChat(props.tabGroupId);
const userInput = ref("");
const messageContainer = ref<HTMLElement | null>(null);

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
        type: "text",
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
        type: "text",
    };
    messages.value.push(newMessage);
    // scrollToBottom();

    const updateFunction = (textChunk: string) => {
        const messageIndex = messages.value.findIndex(
            (m) => m.id === messageId
        );
        if (messageIndex !== -1) {
            messages.value[messageIndex].text += textChunk;
            // scrollToBottom();
        }
    };

    return updateFunction;
};

// --- COMPONENT API and STREAMING LOGIC ---
const chatApi = { streamAiResponse };
const chatApiRef = ref(chatApi);
// useMessageStreamer(chatApiRef);

// --- ANALYSIS CARD METHODS ---
const addAnalysisCard = (id: string, topic: string) => {
    const newMessage: Message = {
        id,
        sender: "ai",
        type: "analysis",
        analysisData: {
            topic,
            status: "analyzing",
            ideas: [],
        },
    };
    messages.value.push(newMessage);
    scrollToBottom();
};

const updateAnalysisCard = (id: string, newIdea: string) => {
    const message = messages.value.find((m) => m.id === id);
    if (message?.analysisData) {
        message.analysisData.ideas.push(newIdea);
        scrollToBottom();
    }
};

const completeAnalysisCard = (id: string) => {
    const message = messages.value.find((m) => m.id === id);
    if (message?.analysisData) {
        message.analysisData.status = "complete";
    }
};

onMounted(() => {
    scrollToBottom();
});

defineExpose({
    streamAiResponse,
    clearChat,
    addAnalysisCard,
    updateAnalysisCard,
    completeAnalysisCard,
});
</script>

<style scoped>
/* Main container setup */
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f0f4f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        Helvetica, Arial, sans-serif;
    color: #3c4043;
    overflow: hidden;
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
.user-message-wrapper .message-bubble p {
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
