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

describe("Complex Scenarios", () => {
    test("should correctly validate a fully compatible desk setup by resolving chained dependencies and power constraints", async () => {
        // Re-initialize to ensure a clean slate, avoiding state from other tests.
        await runMangleInstance(MANGLE_WASM_PATH);

        const facts = [
            // -- Setups (Bundles of components) --
            'is_setup("S1")', // The one that should work
            'setup("S1") has-laptop("L1_Mac")',
            'setup("S1") has-dock("D1_Thunderbolt")',
            'setup("S1") has-monitor("M1_4K")',
            'setup("S1") has-psu("PSU_100W")',

            'is_setup("S2")', // Should fail on power
            'setup("S2") has-laptop("L2_Win")',
            'setup("S2") has-dock("D2_USB-C")',
            'setup("S2") has-monitor("M1_4K")',
            'setup("S2") has-psu("PSU_65W")',

            'is_setup("S3")', // Should fail on port compatibility (Dock->Monitor)
            'setup("S3") has-laptop("L2_Win")',
            'setup("S3") has-dock("D2_USB-C")',
            'setup("S3") has-monitor("M2_Ultrawide")',
            'setup("S3") has-psu("PSU_100W")',

            // -- Laptops --
            'laptop("L1_Mac") requires-port("Thunderbolt")',
            'laptop("L1_Mac") power-draw(45)',
            'laptop("L2_Win") requires-port("USB-C")',
            'laptop("L2_Win") power-draw(60)',

            // -- Docks --
            'dock("D1_Thunderbolt") provides-laptop-port("Thunderbolt")',
            'dock("D1_Thunderbolt") provides-monitor-port("DisplayPort")',
            'dock("D1_Thunderbolt") power-draw(15)',
            'dock("D2_USB-C") provides-laptop-port("USB-C")',
            'dock("D2_USB-C") provides-monitor-port("HDMI")',
            'dock("D2_USB-C") power-draw(10)',

            // -- Monitors --
            'monitor("M1_4K") requires-port("DisplayPort")',
            'monitor("M2_Ultrawide") requires-port("DisplayPort")', // Note: D2 only has HDMI

            // -- Power Supplies --
            'psu("PSU_65W") provides-power(65)',
            'psu("PSU_100W") provides-power(100)',
        ];

        const rules = [
            // -- Level 1 Rule: Port Compatibility --
            // A dock is compatible with a laptop if their connecting ports match.
            'dock_compatible_with_laptop(?dock, ?laptop) :- dock(?dock) provides-laptop-port(?port), laptop(?laptop) requires-port(?port)',
            // A monitor is compatible with a dock if their connecting ports match.
            'monitor_compatible_with_dock(?monitor, ?dock) :- monitor(?monitor) requires-port(?port), dock(?dock) provides-monitor-port(?port)',

            // -- Level 2 Rule: Full Device Chain Compatibility --
            // A setup's device chain is valid if all adjacent devices are compatible.
            'setup_chain_is_compatible(?setup) :- setup(?setup) has-laptop(?laptop) has-dock(?dock) has-monitor(?monitor), dock_compatible_with_laptop(?dock, ?laptop), monitor_compatible_with_dock(?monitor, ?dock)',

            // -- Level 2 Rule: Power Calculation --
            // The total power draw for a setup is the sum of the laptop and dock's draw.
            'setup_power_draw(?setup, ?total_draw) :- setup(?setup) has-laptop(?laptop) has-dock(?dock), laptop(?laptop) power-draw(?p1), dock(?dock) power-draw(?p2), ?total_draw is ?p1 + ?p2',

            // -- Level 3 Rule: Final Validation --
            // A setup is valid if its device chain is compatible AND its power supply can handle the total draw.
            'is_valid_setup(?setup) :- is_setup(?setup), setup_chain_is_compatible(?setup), setup(?setup) has-psu(?psu), psu(?psu) provides-power(?provided_power), setup_power_draw(?setup, ?required_power), ?provided_power >= ?required_power',
        ];

        facts.forEach(fact => {
            const err = mangleDefine(`${fact}.`);
            expect(err).toBe(null);
        });

        rules.forEach(rule => {
            const err = mangleDefine(`${rule}.`);
            expect(err).toBe(null);
        });

        const query = 'is_valid_setup(?setup_id)';
        const result = mangleQuery(query);
        expect(JSON.parse(result.trim())).toEqual([{ setup_id: 'S1' }]);
    });
});
