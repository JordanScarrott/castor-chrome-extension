<template>
    <ChatContainer> </ChatContainer>
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
import ChatContainer from "@/popup/components/ChatContainer.vue";
</script>

<style scoped></style>
