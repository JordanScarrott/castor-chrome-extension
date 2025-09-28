import App from "@/popup/App.vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
// import App from "./App.vue";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.mount("#app");

/**
 * Main user journey:
 *
 * 1. Goal -> Mangle Schema
 * 2. Page content -> Mangle facts
 * 3. Mangle schema -> Mangle query
 * 4. Mangle Query result -> Answer
 */
