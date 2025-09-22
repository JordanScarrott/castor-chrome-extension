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

    test("should infer the best value powerful and portable laptop using complex rules", () => {
        const facts = [
          'laptop(L1) has-brand("Dell")',
          'laptop(L1) has-price(1200)',
          'laptop(L1) has-ram(16)',
          'laptop(L1) has-storage-type("SSD")',
          'laptop(L1) has-screen-size(15.6)',
          'laptop(L1) has-battery(6)', // in hours

          'laptop(L2) has-brand("Apple")',
          'laptop(L2) has-price(1800)',
          'laptop(L2) has-ram(16)',
          'laptop(L2) has-storage-type("SSD")',
          'laptop(L2) has-screen-size(13.3)',
          'laptop(L2) has-battery(12)',

          'laptop(L3) has-brand("HP")',
          'laptop(L3) has-price(950)',
          'laptop(L3) has-ram(8)',
          'laptop(L3) has-storage-type("SSD")',
          'laptop(L3) has-screen-size(14)',
          'laptop(L3) has-battery(8)',

          'laptop(L4) has-brand("Dell")',
          'laptop(L4) has-price(1450)',
          'laptop(L4) has-ram(32)',
          'laptop(L4) has-storage-type("SSD")',
          'laptop(L4) has-screen-size(14)',
          'laptop(L4) has-battery(9)',
        ];

        const rules = [
          // Rule: A laptop is "powerful" if it has 16GB of RAM or more AND an SSD.
          'is_powerful(?laptop) :- laptop(?laptop) has-ram(?ram) has-storage-type("SSD"), ?ram >= 16.',

          // Rule: A laptop is "portable" if its screen size is 14 inches or less AND its battery lasts 8 hours or more.
          'is_portable(?laptop) :- laptop(?laptop) has-screen-size(?size) has-battery(?battery), ?size <= 14, ?battery >= 8.',

          // Rule: A laptop is "good_value" if its price is under 1500.
          'is_good_value(?laptop) :- laptop(?laptop) has-price(?price), ?price < 1500.',
        ];

        facts.forEach(fact => {
            // Facts in mangle need to be terminated by a period.
            const err = mangleDefine(`${fact}.`);
            expect(err).toBe(null);
        });

        rules.forEach(rule => {
            const err = mangleDefine(rule);
            expect(err).toBe(null);
        });

        const query = 'is_powerful(?laptop), is_portable(?laptop), is_good_value(?laptop)';
        const result = mangleQuery(query);
        expect(JSON.parse(result.trim())).toEqual([{ laptop: 'L4' }]);
    });
});

describe('Mangle Core Syntax Validation', () => {
    test('should correctly filter facts by comparing a variable against a literal value in a rule', async () => {
        // --- 1. The Facts ---
        const facts = [
            'item_cost("budget_mouse", 50).',
            'item_cost("premium_keyboard", 150).',
            'item_cost("mid_range_monitor", 100).',
        ];

        // --- 2. The Rule ---
        const rules = [
            'is_affordable(Item) :- item_cost(Item, Cost), Cost <= 100.',
        ];

        facts.forEach(fact => {
            const err = mangleDefine(fact);
            expect(err).toBe(null);
        });

        rules.forEach(rule => {
            const err = mangleDefine(rule);
            expect(err).toBe(null);
        });


        // --- 3. The Query ---
        const query = 'is_affordable(Item)';
        const result = JSON.parse(mangleQuery(query));

        // --- 4. The Assertion ---
        expect(sortResults(result)).toEqual(
            sortResults([
                { Item: '"budget_mouse"' },
                { Item: '"mid_range_monitor"' },
            ])
        );
        expect(result.length).toBe(2);
    });
});
