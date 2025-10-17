import { serviceWorkerApi } from "@/popup/api";
import { MangleSchema } from "@/types/MangleSchema";
import { defineStore } from "pinia";

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
    tabGroupId: number | null; // Added for tab group integration
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
    state: (): SessionState => ({
        sessionTitle: "",
        goal: null, // Initialize as null, will be loaded by init
        tabGroupId: null, // Initialize as null
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
    }),

    // Getters
    getters: {
        hasActiveSession(state): boolean {
            // Session is active if there's a tab group associated with it
            return state.tabGroupId !== null;
        },
    },

    // Actions
    actions: {
        // Initialize the session state from the current tab's context
        async init() {
            if (typeof chrome === "undefined" || !chrome.tabs) return;

            const [currentTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });

            if (currentTab && currentTab.groupId > -1) {
                this.tabGroupId = currentTab.groupId;
                const storageKey = `goal_${this.tabGroupId}`;
                const result = await chrome.storage.local.get(storageKey);
                if (result[storageKey]) {
                    this.goal = result[storageKey];
                }
            }
        },

        // Set a new goal, creating a new tab group
        async setGoal(goalText: string) {
            this.isLoading = true;
            this.goal = goalText;

            if (typeof chrome !== "undefined" && chrome.tabs) {
                const [currentTab] = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });

                if (currentTab?.id) {
                    const newTab = await chrome.tabs.create({
                        windowId: currentTab.windowId,
                        index: currentTab.index + 1,
                        active: true,
                    });
                    const groupId = await chrome.tabs.group({
                        tabIds: [newTab.id!],
                    });
                    const groupName = goalText
                        .split(" ")
                        .slice(0, 5)
                        .join(" ");
                    await chrome.tabGroups.update(groupId, {
                        title: groupName,
                    });

                    this.tabGroupId = groupId;
                    await chrome.storage.local.set({
                        [`goal_${groupId}`]: goalText,
                    });
                }
            }

            try {
                const { schema } = await serviceWorkerApi.generateMangleSchema(
                    goalText
                );
                this.guidingQuestions = schema.guiding_questions;
                this.schema = schema;
            } catch (error) {
                console.error("Failed to generate Mangle Schema:", error);
            } finally {
                this.isLoading = false;
            }
        },

        // Reset the session to allow setting a new goal
        resetSession() {
            this.goal = null;
            this.tabGroupId = null;
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
