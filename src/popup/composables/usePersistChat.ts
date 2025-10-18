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

import { useStorageManager } from "./useStorageManager";
import { useSessionStore } from "../store/sessionStore";

export function usePersistedChat() {
    const sessionStore = useSessionStore();
    const tabGroupId = sessionStore.tabGroupId || "global";
    const storageManager = useStorageManager(tabGroupId);

    const messages = storageManager.useTabGroupStorage(
        "messages",
        [] as Message[]
    );
    const nextId = storageManager.useTabGroupStorage("nextId", 0);

    return { messages, nextId };
}
