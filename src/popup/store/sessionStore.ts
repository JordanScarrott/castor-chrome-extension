import { serviceWorkerApi } from "@/popup/api";
import { MangleSchema } from "@/types/MangleSchema";
import { defineStore } from "pinia";
import { useStorageManager } from "../composables/useStorageManager";
import { watch } from "vue";

// 2. Data Types
export interface Source {
    id: string;
    title: string;
    faviconUrl: string;
    facts: string[];
}

export interface Result {
    type: "text" | "table";
    data: any;
}

export interface SessionState {
    sessionTitle: string;
    goal: string | null;
    tabGroupId: number | null;
    schema: MangleSchema;
    guidingQuestions: string[];
    knowledgeSources: Source[];
    currentResult: Result | null;
    isLoading: boolean;
}

// Mock delay function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSessionStore = defineStore("session", {
    // 1. Pinia Store (`src/store/sessionStore.ts`)
    state: (): SessionState => {
        const tabGroupId =
            Number(localStorage.getItem("activeTabGroupId")) || null;
        const storageManager = useStorageManager(tabGroupId || "global");
        const goal = storageManager.useTabGroupStorage("goal", null);

        const state = {
            sessionTitle: "",
            goal: goal.value,
            tabGroupId,
            guidingQuestions: [],
            schema: {
                guiding_questions: [],
                mangle_facts: [],
                mangle_rules: [],
            } as MangleSchema,
            knowledgeSources: [
                // Mock data as requested
                {
                    id: "1",
                    title: "Ars Technica: The new M3 MacBook Air.",
                    faviconUrl: "https://arstechnica.com/favicon.ico",
                    facts: [
                        'Comes in 13" and 15" models.',
                        "Supports two external displays (when lid is closed).",
                    ],
                },
                {
                    id: "2",
                    title: "The Verge: Apple’s new M3 MacBook Air is here.",
                    faviconUrl: "https://www.theverge.com/favicon.ico",
                    facts: [
                        "Starting price is $1,099.",
                        "Features a fanless design.",
                    ],
                },
            ],
            currentResult: null,
            isLoading: false,
        };

        watch(goal, (newGoal) => {
            state.goal = newGoal;
        });

        return state;
    },

    // Getters
    getters: {
        hasActiveSession(state): boolean {
            return state.goal !== null;
        },
    },

    // Actions
    actions: {
        initSession(title: string, tabGroupId: number) {
            this.sessionTitle = title;
            this.tabGroupId = tabGroupId;
            localStorage.setItem("activeTabGroupId", String(tabGroupId));
            const storageManager = useStorageManager(tabGroupId);
            const goal = storageManager.useTabGroupStorage("goal", null);
            goal.value = title;
        },

        async setGoal(goalText: string, tabGroupId: number) {
            this.isLoading = true;
            this.goal = goalText;
            this.tabGroupId = tabGroupId;
            localStorage.setItem("activeTabGroupId", String(tabGroupId));
            const storageManager = useStorageManager(tabGroupId);
            const goal = storageManager.useTabGroupStorage("goal", null);
            goal.value = goalText;

            try {
                const { schema } = await serviceWorkerApi.generateMangleSchema(
                    goalText
                );
                console.log("Generated Mangle Schema:", schema);
                this.guidingQuestions = schema.guiding_questions;
                this.schema = schema;
            } catch (error) {
                console.error("Failed to generate Mangle Schema:", error);
                // Optionally, set an error state to display to the user
            } finally {
                this.isLoading = false;
            }
        },

        resetSession() {
            this.goal = null;
            this.tabGroupId = null;
            localStorage.removeItem("activeTabGroupId");
        },

        loadSessionForTabGroup(tabGroupId: number | null) {
            if (tabGroupId && tabGroupId > -1) {
                this.tabGroupId = tabGroupId;
                localStorage.setItem("activeTabGroupId", String(tabGroupId));
                const storageManager = useStorageManager(tabGroupId);
                const goal = storageManager.useTabGroupStorage("goal", null);
                this.goal = goal.value;
            } else {
                this.resetSession();
            }
        },

        addSource(source: Source) {
            // Stubbed action
            console.log("addSource action called with:", source);
            // this.knowledgeSources.push(source);
        },

        async addManualSource(content: string) {
            console.log("addManualSource action called with:", content);

            const response = await serviceWorkerApi.processNewContent(
                content,
                this.schema
            );
            console.log("alksdjaklsdljas", response);

            const newSource: Source = {
                id: `manual-${Date.now()}`,
                title: "Manually Added Note",
                faviconUrl: "assets/note-icon.svg", // Placeholder icon
                facts: [
                    "This is a manually added fact.",
                    "The user pasted this content directly.",
                ],
            };
            this.knowledgeSources.push(newSource);
        },

        async executeQuery(queryText: string) {
            this.isLoading = true;
            this.currentResult = null;
            await sleep(2000); // Mock 2-second delay

            if (queryText.toLowerCase().includes("compare")) {
                this.currentResult = {
                    type: "table",
                    data: {
                        headers: [
                            "Feature",
                            "M3 MacBook Air",
                            "M2 MacBook Air",
                        ],
                        rows: [
                            ["Price", "$1,099", "$999"],
                            ["External Displays", "2 (lid closed)", "1"],
                            ["Wi-Fi", "Wi-Fi 6E", "Wi-Fi 6"],
                        ],
                    },
                };
            } else {
                this.currentResult = {
                    type: "text",
                    data: {
                        answer: "The M3 MacBook Air offers significant performance improvements, support for an additional external display when the lid is closed, and faster Wi-Fi 6E connectivity compared to the M2 model.",
                    },
                };
            }
            this.isLoading = false;
        },
    },
});
