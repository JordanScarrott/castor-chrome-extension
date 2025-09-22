<template>
  <div class="results-display">
    <h3>Query Result</h3>
    <div v-if="result">
      <TextResult v-if="result.type === 'text'" :data="result.data" />
      <ComparisonTableResult v-else-if="result.type === 'table'" :data="result.data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Result } from '../store/sessionStore';
import TextResult from './results/TextResult.vue';
import ComparisonTableResult from './results/ComparisonTableResult.vue';

defineProps<{
  result: Result;
}>();
</script>

<style scoped>
.results-display {
  margin-top: 1rem;
}
h3 {
  font-size: 1rem;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
</style>
