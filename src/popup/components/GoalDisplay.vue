<template>
  <div class="goal-display">
    <h2>Current Goal</h2>
    <p>{{ goal }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  goal: string;
}>();
</script>

<style scoped>
.goal-display {
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 1rem 0;
}
h2 {
  font-size: 1rem;
  margin-top: 0;
  color: #555;
}
p {
  font-style: italic;
  color: #333;
}
</style>
