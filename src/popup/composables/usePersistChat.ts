import { onMounted, ref } from "vue";

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
import { MangleQueries } from "@/service-worker-2/handlers/hotelDataHandler";
import { initializeMangleInstance } from "@/tests/modules/mangle/mangleRunTimeUtils";
import {
    runMangleInstance,
    runMangleInstanceRelative,
} from "@/tests/modules/mangle/mangleTestUtils";

// Ensure the Mangle functions are declared if they are globally available
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

export function usePersistedChat() {
    const sessionStore = useSessionStore();
    const tabGroupId = sessionStore.tabGroupId || "global";
    const storageManager = useStorageManager(tabGroupId);

    const messages = storageManager.useTabGroupStorage(
        "messages",
        [] as Message[]
    );
    const nextId = storageManager.useTabGroupStorage("nextId", 0);

    const mangleFacts = storageManager.useTabGroupChromeStorage(
        "mangle_facts",
        [] as string[]
    );
    const mangleRules = storageManager.useTabGroupChromeStorage(
        "mangle_rules",
        [] as string[]
    );
    const mangleQueries = storageManager.useTabGroupChromeStorage(
        "mangle_queries",
        {} as MangleQueries
    );

    onMounted(async () => {
        /**
         * Ingest all saved mangle data from local storage back into Mangle.
         */
        // If mangle is not running this will throw an error and we must reinitialize mangle.
        try {
            const testDefine = mangleDefine('hotel_info("dummy", 0, 0).');
            console.log(
                "Mangle already running. Cancelling mangle re-initialization"
            );
            return;
        } catch (e) {
            console.log("Mangle re-initializing");
        }

        await initializeMangleInstance();

        const primeFacts = [
            'hotel_info("dummy", 0, 0).',
            'hotel_location_score("dummy", 0).',
        ];
        for (const fact of primeFacts) {
            const err = mangleDefine(fact);
            if (err) console.error("Mangle prime fact error:", err);
        }
        for (const fact of mangleFacts.value) {
            const err = mangleDefine(fact);
            if (err) console.error("Mangle prime fact error:", err);
        }
        for (const rule of mangleRules.value) {
            console.log("Ingesting mangle rule:", rule);
            const err = mangleDefine(rule);
            if (err) console.error("Mangle define rule error:", err);
        }
    });

    return {
        messages,
        nextId,
        mangle: { mangleFacts, mangleRules, mangleQueries },
    };
}
