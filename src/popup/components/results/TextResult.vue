<template>
  <div class="text-result">
    <p>{{ data.answer }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    answer: string;
  };
}>();
</script>

<style scoped>
.text-result {
  padding: 1rem;
  background-color: #eef7ff;
  border-left: 4px solid #3b82f6;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
