<template>
  <div class="guiding-questions">
    <button @click="isExpanded = !isExpanded" class="toggle-button">
      {{ isExpanded ? 'Hide' : 'Show' }} Guiding Questions
    </button>
    <div v-if="isExpanded" class="questions-list">
      <ul>
        <li v-for="question in questions" :key="question">{{ question }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  questions: string[];
}>();

const isExpanded = ref(true);
</script>

<style scoped>
.guiding-questions {
  margin: 1rem 0;
}
.toggle-button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  color: #333;
}
.questions-list {
  padding: 0.5rem 0;
}
ul {
  padding-left: 20px;
  margin: 0;
  font-size: 0.9rem;
  color: #555;
}
</style>
