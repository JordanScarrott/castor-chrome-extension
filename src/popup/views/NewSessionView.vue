<template>
  <div class="new-session-view">
    <div v-if="store.isLoading" class="loading-overlay">
      <p>Setting up your research session...</p>
    </div>
    <header>
      <h2>Start a New Research Session</h2>
      <p>Define your primary objective to get started.</p>
    </header>
    <GoalInputForm :is-loading="store.isLoading" @submit-goal="handleGoalSubmission" />
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '../store/sessionStore';
import GoalInputForm from '../components/GoalInputForm.vue';

const store = useSessionStore();

const handleGoalSubmission = (goalText: string) => {
  store.setGoal(goalText);
};
</script>

<style scoped>
.new-session-view {
  padding: 1rem;
}
header {
  text-align: center;
  margin-bottom: 1.5rem;
}
h2 {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}
p {
  color: #555;
}
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
</style>
