import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

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

export async function runMangleInstanceTest() {
    const relativeWASMPath = "../../../../public/mangle/mangle.wasm";
    return await runMangleInstanceRelative(relativeWASMPath);
}

export async function runMangleInstanceRelative(relativeWasmPath: string) {
    const realtivePath = path.resolve(__dirname, relativeWasmPath);

    const go = new Go();
    const wasmBytes = fs.readFileSync(realtivePath);
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, go.importObject);
    go.run(instance);
    return instance;
}
