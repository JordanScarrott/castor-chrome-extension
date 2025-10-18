<template>
  <form @submit.prevent="handleSubmit" class="goal-form">
    <textarea
      v-model="goalText"
      placeholder="Enter your research goal... (e.g., Find a new laptop for programming)"
      :disabled="isLoading"
      required
    ></textarea>
    <button type="submit" :disabled="isLoading">
      {{ isLoading ? 'Starting...' : 'Start Session' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-goal', goalText: string): void;
}>();

const goalText = ref('');

const handleSubmit = () => {
  if (goalText.value.trim()) {
    emit('submit-goal', goalText.value.trim());
  }
};
</script>

<style scoped>
.goal-form {
  display: flex;
  flex-direction: column;
}
textarea {
  min-height: 80px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  margin-bottom: 0.5rem;
}
button {
  padding: 0.75rem;
  border: none;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}
button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}
</style>
