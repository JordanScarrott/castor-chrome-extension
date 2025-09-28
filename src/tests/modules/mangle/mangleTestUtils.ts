import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

// Declare the globals that the WASM module will expose
export declare const Go: any;
export declare function mangleDefine(text: string): string | null;
export declare function mangleQuery(text: string): string;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANGLE_WASM_PATH = path.resolve(
    __dirname,
    "../../../../public/mangle/mangle.wasm"
);

export async function runMangleInstance() {
    const go = new Go();
    const wasmBytes = fs.readFileSync(MANGLE_WASM_PATH);
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, go.importObject);
    go.run(instance);
    return instance;
}
