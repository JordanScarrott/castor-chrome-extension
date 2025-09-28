import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path, { resolve } from "path";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        outDir: "dist",
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "index.html"),
                content: resolve(__dirname, "src/content-script.ts"),
                // background: resolve(__dirname, "src/service-worker/index.ts"),
                background: resolve(__dirname, "src/service-worker-2/index.ts"),
                // background: resolve(__dirname, "src/service-worker-3/index.ts"),
            },
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
    },
});
