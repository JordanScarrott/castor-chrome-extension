<template>
  <div class="analysis-card">
    <div class="card-header">
      <h2 class="topic">{{ data.topic }}</h2>
      <div class="status">
        <div v-if="data.status === 'analyzing'" class="loading-spinner"></div>
        <span v-if="data.status === 'analyzing'">Analyzing...</span>
        <svg v-if="data.status === 'complete'" class="checkmark-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <span v-if="data.status === 'complete'">Complete</span>
      </div>
    </div>
    <ul class="ideas-list">
      <li v-for="(idea, index) in data.ideas" :key="index" class="idea-item">
        {{ idea }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface AnalysisData {
  topic: string;
  status: 'analyzing' | 'complete';
  ideas: string[];
}

interface Props {
  data: AnalysisData;
}

const props = defineProps<Props>();
</script>

<style scoped>
.analysis-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.topic {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #5f6368;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #d1e3ff;
  border-top-color: #0b57d0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.checkmark-icon {
  width: 20px;
  height: 20px;
  fill: #34a853;
}

.ideas-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.idea-item {
  background-color: #f1f3f4;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
