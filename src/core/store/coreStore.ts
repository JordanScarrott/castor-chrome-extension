import { defineStore } from "pinia";
import { ref } from "vue";

export const useCoreStore = defineStore("coreStore", () => {
    const asdf = ref(0);
    return { asdf };
});
