<template>
  <div class="knowledge-base">
    <h3>Knowledge Base</h3>
    <ul class="source-list">
      <KnowledgeSourceItem
        v-for="source in sources"
        :key="source.id"
        :source="source"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { Source } from '../store/sessionStore';
import KnowledgeSourceItem from './KnowledgeSourceItem.vue';

defineProps<{
  sources: Source[];
}>();
</script>

<style scoped>
.knowledge-base {
  margin-top: 1rem;
}
h3 {
  font-size: 1rem;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}
.source-list {
  padding: 0;
  margin-top: 1rem;
}
</style>
