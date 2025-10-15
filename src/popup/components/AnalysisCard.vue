<template>
    <div class="analysis-card">
        <div class="card-header">
            <CastorIcon class="card-icon" :loading="data.status === 'analyzing'" />
            <h3 class="topic">{{ data.topic }}</h3>
            <span v-if="data.status === 'analyzing'" class="status-text">Analyzing...</span>
        </div>
        <div class="ideas-container">
            <TransitionGroup name="idea-list" tag="ul">
                <li v-for="idea in displayedIdeas" :key="idea" class="idea-item">
                    {{ idea }}
                </li>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CastorIcon from './CastorIcon.vue';

interface AnalysisData {
  topic: string;
  status: 'analyzing' | 'complete';
  ideas: string[];
}

const props = defineProps<{
  data: AnalysisData;
}>();

const displayedIdeas = computed(() => props.data.ideas.slice(-3));

</script>

<style scoped>
.analysis-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  overflow: hidden; /* Prevents animated items from overflowing */
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.topic {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1; /* Allow topic to take available space */
}

.status-text {
  font-size: 14px;
  color: #5f6368;
}

.ideas-container {
  position: relative; /* Needed for absolute positioning of leaving items */
}

ul {
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
}

/* TransitionGroup Animations */
.idea-list-move,
.idea-list-enter-active,
.idea-list-leave-active {
    transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}
.idea-list-enter-from,
.idea-list-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
}
.idea-list-leave-active {
    position: absolute;
    width: 100%; /* Ensure leaving item doesn't collapse */
}
</style>
