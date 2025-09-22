<template>
  <div class="active-session-view">
    <SessionHeader :title="store.sessionTitle" />
    <main>
      <GoalDisplay v-if="store.goal" :goal="store.goal" />
      <GuidingQuestions :questions="store.guidingQuestions" />
      <ContentIngestForm @ingest-content="store.addManualSource" />

      <hr />

      <ResultsDisplay v-if="store.currentResult" :result="store.currentResult" />
      <KnowledgeBaseList v-else :sources="store.knowledgeSources" />

      <QueryInput :is-loading="store.isLoading" @submit-query="handleQuery" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '../store/sessionStore';
import SessionHeader from '../components/SessionHeader.vue';
import GoalDisplay from '../components/GoalDisplay.vue';
import GuidingQuestions from '../components/GuidingQuestions.vue';
import KnowledgeBaseList from '../components/KnowledgeBaseList.vue';
import ResultsDisplay from '../components/ResultsDisplay.vue';
import QueryInput from '../components/QueryInput.vue';
import ContentIngestForm from '../components/ContentIngestForm.vue';

const store = useSessionStore();

const handleQuery = (queryText: string) => {
  store.executeQuery(queryText);
};
</script>

<style scoped>
.active-session-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}
main {
  padding: 0 1rem 1rem 1rem;
  flex-grow: 1;
  overflow-y: auto;
}
hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 1rem 0;
}
</style>
