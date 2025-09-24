import { MangleSchema } from "@/types/MangleSchema";

class SessionManager {
    private static instance: SessionManager;
    private userGoal: string | null = null;
    private mangleSchema: MangleSchema | null = null;

    private constructor() { }

    public static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    public setGoal(goal: string): void {
        this.userGoal = goal;
    }

    public getGoal(): string | null {
        return this.userGoal;
    }

    public setMangleSchema(schema: MangleSchema): void {
        this.mangleSchema = schema;
    }

    public getMangleSchema(): MangleSchema | null {
        return this.mangleSchema;
    }

    public hasActiveSession(): boolean {
        return this.userGoal !== null && this.mangleSchema !== null;
    }
}

export const sessionManager = SessionManager.getInstance();