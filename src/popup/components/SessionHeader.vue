<template>
  <header class="session-header">
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped>
.session-header {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  text-align: center;
}
h1 {
  font-size: 1.2rem;
  margin: 0;
}
</style>
