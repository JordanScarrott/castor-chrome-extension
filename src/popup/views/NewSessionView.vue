<template>
    <div class="new-session-container">
        <WelcomeScreen
            v-if="!animationComplete"
            @animation-complete="handleAnimationComplete"
        />
        <template v-else>
            <Header />
            <GoalView />
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WelcomeScreen from "../components/WelcomeScreen.vue";
import Header from "../components/Header.vue";
import GoalView from "../components/GoalView.vue";

const animationComplete = ref(false);

const handleAnimationComplete = () => {
    animationComplete.value = true;
};
</script>

<style scoped>
.new-session-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}
</style>
