<template>
  <li class="source-item">
    <div class="source-header">
      <img :src="source.faviconUrl" alt="" class="favicon" />
      <span class="title">{{ source.title }}</span>
    </div>
    <ul class="fact-list">
      <li v-for="fact in source.facts" :key="fact">{{ fact }}</li>
    </ul>
  </li>
</template>

<script setup lang="ts">
import type { Source } from '../store/sessionStore';

defineProps<{
  source: Source;
}>();
</script>

<style scoped>
.source-item {
  list-style-type: none;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.source-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}
.favicon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
.title {
  font-weight: bold;
  font-size: 0.9rem;
}
.fact-list {
  padding-left: 20px;
  font-size: 0.9rem;
  color: #555;
}
</style>
