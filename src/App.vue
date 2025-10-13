<template>
    <div class="chat-container">
        <div class="header">
            <h1>Mangle AI Assistant</h1>
        </div>
        <div class="message-list" ref="messageList">
            <div
                v-for="(message, index) in messages"
                :key="index"
                class="message"
                :class="['message', `message--${message.author}`]"
            >
                <div class="message-content">{{ message.content }}</div>
            </div>
        </div>
        <div class="input-area">
            <textarea
                v-model="userInput"
                @keydown.enter.prevent="handleAsk"
                placeholder="Ask a question..."
                class="input-box"
                :disabled="isThinking"
            ></textarea>
            <button @click="handleAsk" class="send-button" :disabled="isThinking">
                {{ isThinking ? "Thinking..." : "Ask" }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { serviceWorkerApi } from "./popup/api";

interface Message {
    author: "user" | "ai";
    content: string;
}

const userInput = ref("");
const messages = ref<Message[]>([]);
const isThinking = ref(false);
const messageList = ref<HTMLElement | null>(null);

// Map to store chunk handlers for active streams
const streamHandlers = new Map<string, (chunk: string) => void>();

/**
 * Creates a new, empty AI message bubble in the chat history and returns a
 * function for appending text chunks to it.
 * @returns A function that takes a string chunk and appends it to the new message.
 */
function createAiMessage(): (chunk: string) => void {
    const messageIndex = messages.value.length;
    messages.value.push({ author: "ai", content: "" });

    return (chunk: string) => {
        messages.value[messageIndex].content += chunk;
        scrollToBottom();
    };
}

const handleStreamUpdate = (message: any) => {
    if (message.type !== "STREAM_UPDATE") {
        return;
    }
    const { messageId, chunk, isLast } = message.payload;

    let handler = streamHandlers.get(messageId);

    // If it's the first chunk for this messageId, create a new message bubble
    if (!handler) {
        handler = createAiMessage();
        streamHandlers.set(messageId, handler);
        isThinking.value = false;
    }

    // Append the new chunk
    if (chunk) {
        handler(chunk);
    }

    // If it's the last chunk, clean up the handler
    if (isLast) {
        streamHandlers.delete(messageId);
    }
};

onMounted(() => {
    chrome.runtime.onMessage.addListener(handleStreamUpdate);
});

onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleStreamUpdate);
});

async function handleAsk() {
    if (!userInput.value.trim() || isThinking.value) return;

    const question = userInput.value.trim();
    messages.value.push({ author: "user", content: question });
    isThinking.value = true;
    userInput.value = "";
    scrollToBottom();

    try {
        // This is now a fire-and-forget call; the response will be handled by the stream listener
        await serviceWorkerApi.processNewContent(question);
    } catch (error) {
        console.error("Failed to send question to service worker:", error);
        // Optionally add an error message to the UI
        messages.value.push({
            author: "ai",
            content: "Sorry, I was unable to process your question.",
        });
        isThinking.value = false;
    }
}

function scrollToBottom() {
    nextTick(() => {
        if (messageList.value) {
            messageList.value.scrollTop = messageList.value.scrollHeight;
        }
    });
}
</script>

<style scoped>
.chat-container {
    width: 400px;
    height: 500px;
    display: flex;
    flex-direction: column;
    font-family: sans-serif;
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
}

.header {
    background-color: #f5f5f5;
    padding: 1rem;
    text-align: center;
    border-bottom: 1px solid #ccc;
}

.message-list {
    flex-grow: 1;
    overflow-y: auto;
    padding: 1rem;
    background-color: #fff;
}

.message {
    display: flex;
    margin-bottom: 0.75rem;
}

.message-content {
    max-width: 80%;
    padding: 0.5rem 1rem;
    border-radius: 18px;
    word-wrap: break-word;
}

.message--user {
    justify-content: flex-end;
}

.message--user .message-content {
    background-color: #007bff;
    color: white;
    border-bottom-right-radius: 4px;
}

.message--ai {
    justify-content: flex-start;
}

.message--ai .message-content {
    background-color: #e9e9eb;
    color: #333;
    border-bottom-left-radius: 4px;
}

.input-area {
    display: flex;
    padding: 0.5rem;
    border-top: 1px solid #ccc;
    background-color: #f5f5f5;
}

.input-box {
    flex-grow: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: none;
    font-family: inherit;
}

.send-button {
    margin-left: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 4px;
    cursor: pointer;
}

.send-button:disabled {
    background-color: #a0c7ff;
    cursor: not-allowed;
}
</style>
