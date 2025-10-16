<template>
  <div class="chat-container">
    <Chat :messages="combinedMessages" />
    <MessageInput v-if="conversationId" :conversation-id="conversationId" @sent="onUserSent" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useObservable } from "@vueuse/rxjs";
import { liveQuery } from "dexie";
import { db, ensureConversation } from "@/db";
import Chat from "./Chat.vue";
import MessageInput from "./MessageInput.vue";

const conversationId = ref<number | null>(null);

// Create a conversation on mount
onMounted(async () => {
  const conversation = await ensureConversation({ title: "New Conversation" });
  conversationId.value = conversation.id;
});

const messages = useObservable(
  liveQuery(() => {
    if (!conversationId.value) return [];
    return db.messages
      .where({ conversationId: conversationId.value })
      .sortBy("timestamp");
  }),
  { initialValue: [] }
);

const analysis = useObservable(
  liveQuery(() => {
    if (!conversationId.value) return [];
    return db.analysis
      .where({ conversationId: conversationId.value })
      .sortBy("id");
  }),
  { initialValue: [] }
);

const combinedMessages = computed(() => {
  const allMessages = [
    ...(messages.value || []).map((m) => ({ ...m, type: "text" })),
    ...(analysis.value || []).map((a) => ({ ...a, type: "analysis" })),
  ];
  return allMessages.sort((a, b) => (a.timestamp || a.id) - (b.timestamp || b.id));
});

function onUserSent() {
  // optional: scroll to bottom or other UI tasks after user message
}

const handleElementSelection = (message: any) => {
    if (message.type === 'ELEMENT_TEXT_SELECTED' && conversationId.value) {
        chrome.runtime.sendMessage({
            type: 'ELEMENT_TEXT_SELECTED',
            payload: {
                html: message.payload,
                conversationId: conversationId.value,
            },
        });
    }
};

onMounted(() => {
    chrome.runtime.onMessage.addListener(handleElementSelection);
});

onUnmounted(() => {
    chrome.runtime.onMessage.removeListener(handleElementSelection);
});

</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
