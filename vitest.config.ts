import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: "jsdom",
            // This will execute the script before running your tests,
            // making the 'Go' global available everywhere.
            setupFiles: ["./public/mangle/wasm_exec.js"],
            // environment: "node", // Ensure you are in a node environment
        },
    })
);
