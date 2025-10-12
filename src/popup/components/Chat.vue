<template>
  <div class="flex flex-col h-full max-h-[600px] bg-gray-50 text-gray-800 font-sans">
    <!-- Message History -->
    <div ref="messageContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-for="message in messages" :key="message.id" class="flex" :class="message.sender === 'user' ? 'justify-end' : 'justify-start'">
        <div
          class="rounded-lg px-4 py-2 max-w-xs shadow"
          :class="{
            'bg-blue-500 text-white': message.sender === 'user',
            'bg-white text-gray-800': message.sender === 'ai',
          }"
        >
          {{ message.text }}
        </div>
      </div>
    </div>

    <!-- Action Toolbar & Input Area -->
    <div class="border-t border-gray-200 p-4 bg-gray-100">
      <!-- Guiding Question Chips -->
      <div class="mb-3 flex flex-wrap gap-2">
        <button
          v-for="question in sampleQuestions"
          :key="question"
          @click="() => handleQuestionChipClick(question)"
          class="bg-white border border-gray-300 text-gray-700 text-sm font-medium py-1.5 px-3 rounded-full hover:bg-gray-200 transition-colors"
        >
          {{ question }}
        </button>
      </div>

      <!-- Text Input and Send Button -->
      <form @submit.prevent="handleSubmit" class="flex items-center space-x-2">
        <input
          v-model="userInput"
          type="text"
          placeholder="Type your message here..."
          class="flex-1 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
        />
        <button
          type="submit"
          :disabled="!userInput.trim()"
          class="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

// --- TYPE DEFINITIONS ---
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

// --- EMITS ---
const emit = defineEmits<{
  (e: 'submit-question', questionText: string): void;
}>();

// --- STATE MANAGEMENT ---
const messages = ref<Message[]>([]);
const userInput = ref('');
const messageContainer = ref<HTMLElement | null>(null);
const nextId = ref(0);

const sampleQuestions = ref([
  'Which hotels have the highest rating?',
  'Show me hotels with a pool.',
]);

// --- METHODS ---
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
  });
};

const addMessage = (text: string, sender: 'user' | 'ai') => {
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
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  emit('submit-question', text);
  userInput.value = '';
};

const handleQuestionChipClick = (question: string) => {
  addMessage(question, 'user');
  emit('submit-question', question);
};

// --- EXPOSED METHOD for STREAMING AI RESPONSE ---
const streamAiResponse = (messageId: number) => {
  const newMessage: Message = {
    id: messageId,
    text: '', // Start with empty text
    sender: 'ai',
  };
  messages.value.push(newMessage);
  scrollToBottom();

  const updateFunction = (textChunk: string) => {
    const messageIndex = messages.value.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages.value[messageIndex].text += textChunk;
      scrollToBottom();
    }
  };

  return updateFunction;
};

defineExpose({
  streamAiResponse,
});
</script>
