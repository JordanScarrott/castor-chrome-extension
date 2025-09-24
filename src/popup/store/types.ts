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
}