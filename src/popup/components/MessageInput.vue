<template>
  <div class="input-area">
    <textarea v-model="value" placeholder="Type your message..." rows="2"></textarea>
    <button @click="send" :disabled="isSending || !value.trim()">Send</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { db } from '@/db';

const props = defineProps({
  conversationId: { type: Number, required: true }
});
const emit = defineEmits(['sent']);

const value = ref('');
const isSending = ref(false);

async function send() {
  const content = value.value.trim();
  if (!content) return;
  isSending.value = true;

  try {
    // 1) write user message to DB (single source of truth)
    const timestamp = Date.now();
    await db.messages.add({
      conversationId: props.conversationId,
      role: 'user',
      content,
      timestamp,
      isStreaming: false
    });

    // 2) tell service worker to start AI response
    chrome.runtime.sendMessage(
      {
        type: 'PROCESS_QUESTION',
        payload: {
          question: content,
          conversationId: props.conversationId,
        }
      },
      (resp) => {
        // optional callback
      }
    );

    value.value = '';
    emit('sent');
  } catch (err) {
    console.error('Failed to send message', err);
  } finally {
    isSending.value = false;
  }
}
</script>

<style scoped>
.input-area { display:flex; gap:8px; padding:8px; align-items:flex-end; }
textarea { flex:1; resize:none; padding:8px; }
button { padding:8px 12px; }
</style>
