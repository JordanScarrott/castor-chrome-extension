<template>
  <form @submit.prevent="handleSubmit" class="query-form">
    <input
      v-model="queryText"
      type="text"
      placeholder="Ask a question..."
      :disabled="isLoading"
    />
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? '...' : 'Ask' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-query', queryText: string): void;
}>();

const queryText = ref('');

const handleSubmit = () => {
  if (queryText.value.trim()) {
    emit('submit-query', queryText.value.trim());
    queryText.value = '';
  }
};
</script>

<style scoped>
.query-form {
  display: flex;
  margin-top: 1rem;
}
input {
  flex-grow: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
}
button {
  padding: 0.5rem 1rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}
button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
