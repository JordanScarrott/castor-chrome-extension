import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";

// Declare the globals that the WASM module will expose
declare const Go: any;
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

// Helper function to sort results for comparison.
// This is necessary because the order of results from the mangle query is not guaranteed.
function sortResults<T>(arr: T[]): T[] {
    return arr.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANGLE_WASM_PATH = path.resolve(
    __dirname,
    "../../../../public/mangle/mangle.wasm"
);

async function runMangleInstance(wasmPath: string) {
    const go = new Go();
    const wasmBytes = fs.readFileSync(wasmPath);
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, go.importObject);
    go.run(instance);
    return instance;
}

describe("Mangle WASM Module", () => {
    beforeAll(async () => {
        await runMangleInstance(MANGLE_WASM_PATH);
    });

    test("should define and query simple facts", () => {
        let err = mangleDefine("foo(1, 2).");
        expect(err).toBe(null);
        err = mangleDefine('bar("baz").');
        expect(err).toBe(null);

        const result = mangleQuery("foo(X, Y)");
        expect(JSON.parse(result.trim())).toEqual([{ X: "1", Y: "2" }]);

        const result2 = mangleQuery("bar(X)");
        expect(JSON.parse(result2.trim())).toEqual([{ X: '"baz"' }]);
    });

    test("should return an error for invalid queries", () => {
        const errResult = mangleQuery("foo(");
        expect(errResult.startsWith("Error:")).toBe(true);
    });

    test("should handle more complex queries and rules", () => {
        mangleDefine('lives_in("Leo", "Paris").');
        mangleDefine('lives_in("Mia", "Tokyo").');
        mangleDefine('lives_in("Zoe", "Paris").');
        mangleDefine('travels_to("Mia", "Paris").');

        const result1 = mangleQuery('lives_in(Name, "Paris")');
        const parsedResult1 = JSON.parse(result1);
        expect(sortResults(parsedResult1)).toEqual(sortResults([
            { Name: '"Leo"' },
            { Name: '"Zoe"' },
        ]));

        const result2 = mangleQuery(
            'travels_to("Mia", Destination), lives_in(Name, Destination)'
        );
        expect(JSON.parse(result2)).toEqual([{ Destination: '"Paris"' }]);

        const rule =
            "visitorAndLocal(V, L, D) :- travels_to(V, D), lives_in(L, D).";
        mangleDefine(rule);
        const result3 = mangleQuery(
            'visitorAndLocal("Mia", Name, Destination)'
        );
        const parsedResult3 = JSON.parse(result3);
        expect(sortResults(parsedResult3)).toEqual(sortResults([
            { Destination: '"Paris"', Name: '"Leo"' },
            { Destination: '"Paris"', Name: '"Zoe"' },
        ]));
    });
});
