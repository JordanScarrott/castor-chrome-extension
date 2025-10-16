import { ref } from "vue";

export interface Message {
    id: number | string;
    sender: "user" | "ai";
    type: "text" | "analysis";
    text?: string; // For standard messages
    analysisData?: {
        topic: string;
        status: "analyzing" | "complete";
        ideas: string[];
    };
}

import { useStorage } from "@vueuse/core";

export function usePersistedChat() {
    const messages = useStorage("messages", [] as Message[]);
    const nextId = useStorage("nextId", ref(0));

    return { messages, nextId };
}
