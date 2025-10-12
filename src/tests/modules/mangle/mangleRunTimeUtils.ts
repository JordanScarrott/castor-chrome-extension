// This file contains the browser-specific logic for initializing the Mangle WASM instance.

// Ensure the Go class is declared, as it will be loaded by the service worker's bundle.
declare const Go: any;

let isMangleInitialized = false;
let mangleInitializationPromise: Promise<void> | null = null;

/**
 * Initializes the Mangle WebAssembly module.
 * This function assumes the Go glue script (`wasm_exec.js`) has already been loaded
 * into the global scope by the service worker's build process.
 * @returns A promise that resolves when Mangle is ready, or rejects on error.
 */
export function initializeMangleInstance(): Promise<void> {
    // If initialization is already in progress or complete, return the existing promise
    if (mangleInitializationPromise) {
        return mangleInitializationPromise;
    }

    mangleInitializationPromise = (async () => {
        try {
            // The `Go` class is now expected to be globally available.
            if (typeof Go === "undefined") {
                throw new Error(
                    "Go glue code was not loaded. Check the service worker bundle."
                );
            }

            const go = new Go();
            const wasmUrl = chrome.runtime.getURL("mangle/mangle.wasm");

            const result = await WebAssembly.instantiateStreaming(
                fetch(wasmUrl),
                go.importObject
            );

            // Run the Go program. This is a non-terminating process.
            go.run(result.instance);

            // --- THE FIX ---
            // Yield to the event loop with a timeout of 0. This gives the Go runtime
            // a moment to initialize its internal state before we start calling it.
            await new Promise((resolve) => setTimeout(resolve, 0));

            isMangleInitialized = true;
            console.log(
                "Mangle WASM instance has been initialized successfully."
            );
        } catch (error) {
            console.error("Failed to initialize Mangle WASM:", error);
            mangleInitializationPromise = null; // Reset promise on failure
            throw error;
        }
    })();

    return mangleInitializationPromise;
}
