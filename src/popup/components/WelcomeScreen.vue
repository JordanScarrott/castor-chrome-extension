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
  background-color: transparent;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: background-color 0.5s ease;
}

.spark-icon-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
  animation: pulse 1s ease-in-out;
}

.spark-icon {
  font-size: 2.25rem; /* 36px */
  animation: pulse-inner 1s ease-in-out;
}

.welcome-container.animate-start {
  background-color: #111827; /* bg-gray-900 */
}

.welcome-container.animate-start .spark-icon-wrapper {
  animation: expand 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards 0.5s;
}

.welcome-container.animate-start .spark-icon {
  animation: none;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
}

.content.fade-in {
  opacity: 1;
}

h1 {
  font-size: 1.5rem; /* 24px */
  font-weight: 700;
  color: #F3F4F6; /* text-gray-100 */
  margin-bottom: 1.5rem; /* 24px */
}

.input-wrapper {
  position: relative;
  width: 100%;
  max-width: 28rem; /* 448px */
}

.goal-input {
  width: 100%;
  background-color: #1F2937; /* bg-gray-800 */
  color: white;
  border-radius: 9999px;
  padding: 1rem 1.5rem;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
}

.goal-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); /* focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 */
}

.goal-input::placeholder {
  color: #6B7280; /* text-gray-500 */
}

.cursor {
  position: absolute;
  right: 1.5rem; /* 24px */
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  width: 1.5px;
  height: 24px;
  background-color: #60A5FA; /* text-blue-400 */
  animation: blink 1s infinite;
}

.cursor.blink-end {
  opacity: 1;
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
    filter: drop-shadow(0 0 2px #FBBF24); /* yellow-300 */
  }
  50% {
    filter: drop-shadow(0 0 10px #FBBF24);
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
