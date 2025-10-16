<template>
  <div
    class="welcome-container"
    :class="{ 'animate-start': startAnimation }"
  >
    <div class="spark-icon-wrapper">
      <div class="spark-icon">✨</div>
    </div>
    <div class="content" :class="{ 'fade-in': showContent }">
      <h1>What is your goal?</h1>
      <form class="input-wrapper" @submit.prevent="handleGoalSubmission">
        <input
          v-model="goalInput"
          type="text"
          :placeholder="animatedPlaceholder"
          class="goal-input"
        />
        <span
          class="cursor"
          :class="{ 'blink-end': animatedPlaceholder.length > 0 && goalInput.length === 0 }"
        ></span>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTypingAnimation } from '../composables/useTypingAnimation';
import { useSessionStore } from '../store/sessionStore';

const store = useSessionStore();
const goalInput = ref('');

const goals = [
  'Compare Dell XPS 15 laptops for video editing.',
  'Find a hotel near the V&A Waterfront on a MyCiTi bus route.',
  'Shop for a \'get well soon\' basket with local Cape Town treats.',
  'Observe console logs and find the bug on this page.',
];

const { currentPhrase: animatedPlaceholder } = useTypingAnimation(goals);

const startAnimation = ref(false);
const showContent = ref(false);

const handleGoalSubmission = () => {
  if (goalInput.value.trim()) {
    store.setGoal(goalInput.value.trim());
  }
};

onMounted(() => {
  setTimeout(() => {
    startAnimation.value = true;
  }, 100);

  setTimeout(() => {
    showContent.value = true;
  }, 1100); // Should be timed with the expand animation
});
</script>

<style scoped>
.welcome-container {
  @apply bg-transparent h-full w-full flex items-center justify-center relative overflow-hidden;
  transition: background-color 0.5s ease;
}

.spark-icon-wrapper {
  @apply absolute inset-0 flex items-center justify-center;
  transform-origin: center;
  animation: pulse 1s ease-in-out;
}

.spark-icon {
  @apply text-4xl;
  animation: pulse-inner 1s ease-in-out;
}

.welcome-container.animate-start {
  @apply bg-gray-900;
}

.welcome-container.animate-start .spark-icon-wrapper {
  animation: expand 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s;
}

.welcome-container.animate-start .spark-icon {
  animation: none;
}

.content {
  @apply flex flex-col items-center justify-center text-center opacity-0;
  transition: opacity 0.8s ease-in-out;
}

.content.fade-in {
  @apply opacity-100;
}

h1 {
  @apply text-2xl font-bold text-gray-100 mb-6;
}

.input-wrapper {
  @apply relative w-full max-w-md;
}

.goal-input {
  @apply w-full bg-gray-800 text-white rounded-full px-6 py-4;
  @apply border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50;
  transition: all 0.2s ease-in-out;
}

.goal-input::placeholder {
  @apply text-gray-500;
}

.cursor {
  @apply absolute right-6 top-1/2 -translate-y-1/2 text-blue-400 opacity-0;
  width: 1.5px;
  height: 24px;
  background-color: theme('colors.blue.400');
  animation: blink 1s infinite;
}

.cursor.blink-end {
  @apply opacity-100;
  animation: none;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

@keyframes pulse-inner {
  0%,
  100% {
    filter: drop-shadow(0 0 2px theme('colors.yellow.300'));
  }
  50% {
    filter: drop-shadow(0 0 10px theme('colors.yellow.300'));
  }
}

@keyframes expand {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(100);
    opacity: 0;
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
