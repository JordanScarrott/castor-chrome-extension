import { Mangle, Predicate } from "mangle-utils";

class MangleEngine {
    private db: Mangle;

    constructor() {
        this.db = new Mangle();
    }

    public async insert(factsAndRules: string): Promise<void> {
        await this.db.add(factsAndRules);
    }

    public async query(predicate: string): Promise<Predicate[]> {
        return this.db.query(predicate);
    }

    public async clear(): Promise<void> {
        this.db = new Mangle();
    }
}

export const mangleEngine = new MangleEngine();