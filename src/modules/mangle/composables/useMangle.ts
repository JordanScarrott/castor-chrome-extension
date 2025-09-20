import { onMounted, ref } from "vue";
import type { Ref } from "vue";

declare const Go: any;
declare global {
    interface Window {
        mangle: (text: string) => string;
    }
}

export function useMangle() {
    const mangledText: Ref<string> = ref("");
    const isWasmLoaded: Ref<boolean> = ref(false);

    onMounted(() => {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL("mangle/wasm_exec.js");
        script.onload = async () => {
            const go = new Go();
            const wasmUrl = chrome.runtime.getURL("mangle/mangle.wasm");

            try {
                const result = await WebAssembly.instantiateStreaming(
                    fetch(wasmUrl),
                    go.importObject
                );
                go.run(result.instance);
                isWasmLoaded.value = true;
            } catch (error) {
                console.error("Error loading Wasm module:", error);
            }
        };
        document.head.appendChild(script);
    });

    function mangle(text: string): string {
        if (!isWasmLoaded.value) {
            console.warn("WASM module not loaded yet.");
            // Fallback behavior
            return text.split("").reverse().join("");
        }
        mangledText.value = window.mangle(text);
        return mangledText.value;
    }

    return {
        mangledText,
        mangle,
        isWasmLoaded,
    };
}
