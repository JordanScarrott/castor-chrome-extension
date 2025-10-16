<template>
    <div class="chat-container">
        <!-- Header -->
        <div class="chat-header">
            <CastorIcon />
            <h1 class="header-title">Castor</h1>
        </div>

        <!-- Message History -->
        <div ref="messageContainer" class="message-history">
            <!-- Existing Messages -->
            <div v-for="message in props.messages" :key="message.id">
                <div
                    v-if="message.type === 'analysis'"
                    class="message-wrapper ai-message-wrapper"
                >
                    <AnalysisCard :data="message" />
                </div>
                <div
                    v-else
                    class="message-wrapper"
                    :class="
                        message.role === 'user'
                            ? 'user-message-wrapper'
                            : 'ai-message-wrapper'
                    "
                >
                    <div class="message-bubble">
                        <MarkdownStream
                            v-if="message.role === 'assistant'"
                            :stream="message.content!"
                        />
                        <p v-else>{{ message.content }}</p>
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
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import MarkdownStream from "./MarkdownStream.vue";
import { usePageAttachment } from "../composables/usePageAttachment";
import HorizontalScroller from "./HorizontalScroller.vue";
import AnalysisCard from "./AnalysisCard.vue";
import CastorIcon from "./CastorIcon.vue";

import type { Message, Analysis } from "@/db";

// --- TYPE DEFINITIONS ---
interface Props {
    messages: (Message | Analysis & { type: 'analysis' })[];
    sampleQuestions?: string[];
    isLoading?: boolean;
}

// --- PROPS ---
const props = withDefaults(defineProps<Props>(), {
    messages: () => [],
    sampleQuestions: () => [
        "Which hotels have the highest rating?",
        "Show me hotels with a pool.",
    ],
    isLoading: false,
});

// --- STATE MANAGEMENT ---
const messageContainer = ref<HTMLElement | null>(null);

// --- COMPOSABLES ---
const { attachFromPage } = usePageAttachment();

// --- METHODS ---
const scrollToBottom = () => {
    nextTick(() => {
        if (messageContainer.value) {
            messageContainer.value.scrollTop =
                messageContainer.value.scrollHeight;
        }
    });
};

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

.header-title {
    margin-left: 8px;
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
.user-message-wrapper .message-bubble p {
    margin: 0;
    white-space: pre-wrap;
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
