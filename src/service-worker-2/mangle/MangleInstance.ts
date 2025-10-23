// This line is crucial. It tells Vite to find wasm_exec.js and include its
// contents directly in the final background.js bundle.
// This makes the `Go` class available globally in the service worker.
import "@/../../public/mangle/wasm_exec.js";

// Declare the globals that the WASM module will expose
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

class MangleInstance {
    private static instance: MangleInstance;
    private go: any;
    private wasm: WebAssembly.Instance | null = null;
    private isReadyPromise: Promise<void>;

    private constructor() {
        this.go = new (globalThis as any).Go();
        this.isReadyPromise = this.init();
    }

    public static getInstance(): MangleInstance {
        if (!MangleInstance.instance) {
            MangleInstance.instance = new MangleInstance();
        }
        return MangleInstance.instance;
    }

    private async init(): Promise<void> {
        try {
            // Ensure this runs only once.
            if (this.wasm) {
                return;
            }
            const wasmPath = chrome.runtime.getURL("mangle/mangle.wasm");
            const result = await WebAssembly.instantiateStreaming(
                fetch(wasmPath),
                this.go.importObject
            );
            this.wasm = result.instance;
            // The `run` method is asynchronous but we don't need to wait for it.
            // It sets up the global environment and then idles.
            this.go.run(this.wasm);
            console.log("Mangle Wasm module instantiated and run.");
        } catch (error) {
            console.error("Failed to initialize Mangle Wasm module:", error);
            throw error; // Propagate the error to prevent further execution
        }
    }

    public async whenReady(): Promise<void> {
        return this.isReadyPromise;
    }

    /**
     * Defines facts or rules in the Mangle engine.
     * @param facts A string containing one or more facts or rules, each ending with a period.
     * @throws Throws an error if the Mangle engine returns an error string.
     */
    public async define(facts: string): Promise<void> {
        await this.whenReady();
        const err = mangleDefine(facts);
        if (err) {
            console.error("Mangle define error:", err);
            throw new Error(err);
        }
    }

    /**
     * Executes a query against the Mangle engine.
     * @param query The query string to execute.
     * @returns A JSON string representing the query result.
     */
    public async query(query: string): Promise<string> {
        await this.whenReady();
        return mangleQuery(query);
    }
}

export const mangleInstance = MangleInstance.getInstance();
