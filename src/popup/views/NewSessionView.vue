<template>
    <div class="new-session-container">
        <WelcomeScreen
            v-if="!animationComplete"
            @animation-complete="handleAnimationComplete"
        />
        <template v-else>
            <Header />
            <GoalView v-if="!sessionStore.hasActiveSession" />
            <ChatContainer v-else />
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import WelcomeScreen from "../components/WelcomeScreen.vue";
import Header from "../components/Header.vue";
import GoalView from "../components/GoalView.vue";
import ChatContainer from "../components/ChatContainer.vue";
import { useSessionStore } from "../store/sessionStore";

const animationComplete = ref(false);
const sessionStore = useSessionStore();

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
