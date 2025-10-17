import { ref, computed } from "vue";
import { useChromeStorage } from "./useChromeStorage";

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

export function usePersistedChat(tabGroupId: number | null) {
    const messagesKey = computed(() =>
        tabGroupId ? `messages_${tabGroupId}` : "messages_default"
    );
    const nextIdKey = computed(() =>
        tabGroupId ? `nextId_${tabGroupId}` : "nextId_default"
    );

    const messages = useChromeStorage(messagesKey.value, [] as Message[]);
    const nextId = useChromeStorage(nextIdKey.value, 0);

    return { messages, nextId };
}
