import { serviceWorkerApi } from "@/popup/api";
import { defineStore } from "pinia";
import { Result, SessionState, Source } from "./types";

// Mock delay function
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MANUAL_SOURCE_ID_PREFIX = "manual-";
const MANUAL_SOURCE_TITLE = "Manually Added Note";
const MANUAL_SOURCE_FAVICON_URL = "assets/note-icon.svg";

export const useSessionStore = defineStore("session", {
    // 1. Pinia Store (`src/store/sessionStore.ts`)
    state: (): SessionState => ({
        sessionTitle: "",
        goal: null,
        guidingQuestions: [],
        knowledgeSources: [],
        currentResult: null,
        isLoading: false,
    }),

    // Getters
    getters: {
        hasActiveSession(state): boolean {
            return state.goal !== null;
        },
    },

    // Actions
    actions: {
        initSession(title: string) {
            this.sessionTitle = title;
        },

        async setGoal(goalText: string) {
            this.isLoading = true;
            this.goal = goalText;

            try {
                const { schema } = await serviceWorkerApi.generateMangleSchema(goalText);
                console.log('Generated Mangle Schema:', schema);
                this.guidingQuestions = schema.guiding_questions;
            } catch (error) {
                console.error('Failed to generate Mangle Schema:', error);
                // Optionally, set an error state to display to the user
            } finally {
                this.isLoading = false;
            }
        },

        async addManualSource(content: string) {
            console.log("addManualSource action called with:", content);

            const response = await serviceWorkerApi.processNewContent(content);
            console.log("alksdjaklsdljas", response);

            const newSource: Source = {
                id: `${MANUAL_SOURCE_ID_PREFIX}${Date.now()}`,
                title: MANUAL_SOURCE_TITLE,
                faviconUrl: MANUAL_SOURCE_FAVICON_URL,
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
