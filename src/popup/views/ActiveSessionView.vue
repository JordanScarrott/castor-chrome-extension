<template>
    <Chat> </Chat>
    <!-- <div class="active-session-view">
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
    </div> -->
</template>

<script setup lang="ts">
import Chat from "@/popup/components/Chat.vue";
</script>

<style scoped></style>
