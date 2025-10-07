import { runMangleInstance } from "@/tests/modules/mangle/mangleTestUtils";
import { beforeAll, describe, expect, test } from "vitest";

// Declare the globals that the WASM module will expose
declare const Go: any;
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

// Helper function to sort results for comparison.
// This is necessary because the order of results from the mangle query is not guaranteed.
function sortResults<T>(arr: T[]): T[] {
    return arr.sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
    );
}

describe.skip("Mangle WASM Module", () => {
    beforeAll(async () => {
        await runMangleInstance();
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
        expect(sortResults(parsedResult1)).toEqual(
            sortResults([{ Name: '"Leo"' }, { Name: '"Zoe"' }])
        );

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
        expect(sortResults(parsedResult3)).toEqual(
            sortResults([
                { Destination: '"Paris"', Name: '"Leo"' },
                { Destination: '"Paris"', Name: '"Zoe"' },
            ])
        );
    });

    test("should infer the best value powerful and portable laptop using complex rules", () => {
        const facts = [
            'laptop(L1) has-brand("Dell")',
            "laptop(L1) has-price(1200)",
            "laptop(L1) has-ram(16)",
            'laptop(L1) has-storage-type("SSD")',
            "laptop(L1) has-screen-size(15.6)",
            "laptop(L1) has-battery(6)", // in hours

            'laptop(L2) has-brand("Apple")',
            "laptop(L2) has-price(1800)",
            "laptop(L2) has-ram(16)",
            'laptop(L2) has-storage-type("SSD")',
            "laptop(L2) has-screen-size(13.3)",
            "laptop(L2) has-battery(12)",

            'laptop(L3) has-brand("HP")',
            "laptop(L3) has-price(950)",
            "laptop(L3) has-ram(8)",
            'laptop(L3) has-storage-type("SSD")',
            "laptop(L3) has-screen-size(14)",
            "laptop(L3) has-battery(8)",

            'laptop(L4) has-brand("Dell")',
            "laptop(L4) has-price(1450)",
            "laptop(L4) has-ram(32)",
            'laptop(L4) has-storage-type("SSD")',
            "laptop(L4) has-screen-size(14)",
            "laptop(L4) has-battery(9)",
        ];

        const rules = [
            // Rule: A laptop is "powerful" if it has 16GB of RAM or more AND an SSD.
            'is_powerful(?laptop) :- laptop(?laptop) has-ram(?ram) has-storage-type("SSD"), ?ram >= 16.',

            // Rule: A laptop is "portable" if its screen size is 14 inches or less AND its battery lasts 8 hours or more.
            "is_portable(?laptop) :- laptop(?laptop) has-screen-size(?size) has-battery(?battery), ?size <= 14, ?battery >= 8.",

            // Rule: A laptop is "good_value" if its price is under 1500.
            "is_good_value(?laptop) :- laptop(?laptop) has-price(?price), ?price < 1500.",
        ];

        facts.forEach((fact) => {
            // Facts in mangle need to be terminated by a period.
            const err = mangleDefine(`${fact}.`);
            expect(err).toBe(null);
        });

        rules.forEach((rule) => {
            const err = mangleDefine(rule);
            expect(err).toBe(null);
        });

        const query =
            "is_powerful(?laptop), is_portable(?laptop), is_good_value(?laptop)";
        const result = mangleQuery(query);
        expect(JSON.parse(result.trim())).toEqual([{ laptop: "L4" }]);
    });

    describe("Real-World Scenarios", () => {
        test("should recommend a valid, diet-compatible meal that prioritizes using expiring ingredients", () => {
            const facts = [
                // -- Pantry Inventory (What I have) --
                'pantry("pasta") has-quantity(500)', // in grams
                'pantry("tomato_sauce") has-quantity(400)',
                'pantry("pesto") has-quantity(200)',
                'pantry("chicken_breast") has-quantity(2)',
                'pantry("chicken_breast") expires-in-days(2)', // This is about to go bad!
                'pantry("spinach") has-quantity(100)',
                'pantry("spinach") expires-in-days(3)',
                'pantry("chickpeas") has-quantity(1)', // can

                // -- Ingredient Properties (Dietary Info) --
                'ingredient("pasta") is("carb")',
                'ingredient("tomato_sauce") is("vegan")',
                'ingredient("pesto") is("vegetarian")', // Note: Pesto often has cheese, so not vegan
                'ingredient("chicken_breast") is("protein")',
                'ingredient("chicken_breast") is("meat")',
                'ingredient("spinach") is("vegan")',
                'ingredient("chickpeas") is("vegan")',
                'ingredient("chickpeas") is("protein")',

                // -- Recipes (The rules for making meals) --
                'recipe("Chicken Pasta") requires("pasta")',
                'recipe("Chicken Pasta") requires("tomato_sauce")',
                'recipe("Chicken Pasta") requires("chicken_breast")',

                'recipe("Pesto Pasta") requires("pasta")',
                'recipe("Pesto Pasta") requires("pesto")',

                'recipe("Chickpea Spinach Curry") requires("spinach")',
                'recipe("Chickpea Spinach Curry") requires("chickpeas")',
                'recipe("Chickpea Spinach Curry") requires("tomato_sauce")',
            ];

            const rules = [
                // Rule: An ingredient is available if it exists in the pantry.
                "is_available(?ing) :- pantry(?ing) has-quantity(?q), ?q > 0.",

                // Rule: A recipe is "makable" if all of its required ingredients are available in the pantry.
                "is_makable(?meal) :- recipe(?meal), not (recipe(?meal) requires(?ing), not is_available(?ing)).",

                // Rule: A recipe is vegan if none of its required ingredients are meat.
                'is_vegan_recipe(?meal) :- recipe(?meal), not (recipe(?meal) requires(?ing), ingredient(?ing) is("meat")).',

                // Rule: A recipe uses "expiring food" if at least one of its ingredients expires in 3 days or less.
                "uses_expiring_food(?meal) :- recipe(?meal) requires(?ing), pantry(?ing) expires-in-days(?days), ?days <= 3.",

                // -- Final Decision Rule --
                // A meal is an "optimal choice" if it is makable, fits the dietary goal, and uses expiring food.
                "is_optimal_choice(?meal) :- is_makable(?meal), is_vegan_recipe(?meal), uses_expiring_food(?meal).",
            ];

            facts.forEach((fact) => {
                const err = mangleDefine(`${fact}.`);
                expect(err).toBe(null);
            });

            rules.forEach((rule) => {
                const err = mangleDefine(rule);
                expect(err).toBe(null);
            });

            const query = "is_optimal_choice(?meal)";
            const result = mangleQuery(query);
            expect(JSON.parse(result.trim())).toEqual([
                { meal: "Chickpea Spinach Curry" },
            ]);
        });
    });
});

describe.skip("Complex Scenarios", () => {
    test("should correctly validate a fully compatible desk setup by resolving chained dependencies and power constraints", async () => {
        // Re-initialize to ensure a clean slate, avoiding state from other tests.
        await runMangleInstance();

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
            "dock_compatible_with_laptop(?dock, ?laptop) :- dock(?dock) provides-laptop-port(?port), laptop(?laptop) requires-port(?port)",
            // A monitor is compatible with a dock if their connecting ports match.
            "monitor_compatible_with_dock(?monitor, ?dock) :- monitor(?monitor) requires-port(?port), dock(?dock) provides-monitor-port(?port)",

            // -- Level 2 Rule: Full Device Chain Compatibility --
            // A setup's device chain is valid if all adjacent devices are compatible.
            "setup_chain_is_compatible(?setup) :- setup(?setup) has-laptop(?laptop) has-dock(?dock) has-monitor(?monitor), dock_compatible_with_laptop(?dock, ?laptop), monitor_compatible_with_dock(?monitor, ?dock)",

            // -- Level 2 Rule: Power Calculation --
            // The total power draw for a setup is the sum of the laptop and dock's draw.
            "setup_power_draw(?setup, ?total_draw) :- setup(?setup) has-laptop(?laptop) has-dock(?dock), laptop(?laptop) power-draw(?p1), dock(?dock) power-draw(?p2), ?total_draw is ?p1 + ?p2",

            // -- Level 3 Rule: Final Validation --
            // A setup is valid if its device chain is compatible AND its power supply can handle the total draw.
            "is_valid_setup(?setup) :- is_setup(?setup), setup_chain_is_compatible(?setup), setup(?setup) has-psu(?psu), psu(?psu) provides-power(?provided_power), setup_power_draw(?setup, ?required_power), ?provided_power >= ?required_power",
        ];

        facts.forEach((fact) => {
            const err = mangleDefine(`${fact}.`);
            expect(err).toBe(null);
        });

        rules.forEach((rule) => {
            const err = mangleDefine(`${rule}.`);
            expect(err).toBe(null);
        });

        const query = "is_valid_setup(?setup_id)";
        const result = mangleQuery(query);
        expect(JSON.parse(result.trim())).toEqual([{ setup_id: "S1" }]);
    });
});
