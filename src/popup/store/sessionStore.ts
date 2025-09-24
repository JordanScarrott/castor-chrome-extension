import { serviceWorkerApi } from "@/popup/api";
import { defineStore } from "pinia";

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
    guidingQuestions: string[];
    knowledgeSources: Source[];
    currentResult: Result | null;
    isLoading: boolean;
    hasActiveSession: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSessionStore = defineStore("session", {
    state: (): SessionState => ({
        sessionTitle: "",
        goal: null,
        guidingQuestions: [],
        knowledgeSources: [],
        currentResult: null,
        isLoading: false,
        hasActiveSession: false,
    }),

    actions: {
        initSession(title: string) {
            this.sessionTitle = title;
        },

        async setGoal(goalText: string) {
            this.isLoading = true;
            this.goal = goalText;

            try {
                const { schema } = await serviceWorkerApi.generateMangleSchema(goalText);
                this.guidingQuestions = schema.guiding_questions;
                this.hasActiveSession = true;
            } catch (error) {
                console.error('Failed to generate Mangle Schema:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async addManualSource(content: string) {
            this.isLoading = true;
            try {
                await serviceWorkerApi.processNewContent(content);
                // Here you might want to refresh the knowledge sources
                // or wait for a message from the service worker with updates.
            } catch (error) {
                console.error('Failed to process new content:', error);
            } finally {
                this.isLoading = false;
            }
        },

        async executeQuery(queryText: string) {
            this.isLoading = true;
            this.currentResult = null;
            try {
                const results = await serviceWorkerApi.executeQuery(queryText);
                // This part needs to be adapted based on the actual
                // structure of the query results from Mangle.
                this.currentResult = {
                    type: "text",
                    data: { answer: JSON.stringify(results, null, 2) },
                };
            } catch (error) {
                console.error('Failed to execute query:', error);
            } finally {
                this.isLoading = false;
            }
        },
    },
});
