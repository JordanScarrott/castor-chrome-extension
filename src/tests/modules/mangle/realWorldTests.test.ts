import { runMangleInstance } from "@/tests/modules/mangle/mangleTestUtils";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

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

describe("Travel Planner Schema Tests", () => {
    beforeEach(async () => {
        // Reset the Mangle instance before each test to ensure a clean state
        await runMangleInstance();
    });

    // Test the intermediate rule: attraction_is_bus_accessible
    describe("attraction_is_bus_accessible rule", () => {
        const rule =
            'attraction_is_bus_accessible(Attraction, BusStop) :- attraction_near_location(Attraction, BusStop), bus_stop_on_route(BusStop, "107").';

        test("should find an attraction that is on the correct bus route", () => {
            // 1. Define mock facts
            expect(
                mangleDefine("bus_stop_on_route('Kloof Nek', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Table Mountain Cableway', 'Kloof Nek')."
                )
            ).toBeNull();

            // 2. Define the rule
            expect(mangleDefine(rule)).toBeNull();

            // 3. Query and assert
            const result = mangleQuery(
                "attraction_is_bus_accessible(Attraction, Stop)"
            );
            expect(JSON.parse(result.trim())).toEqual([
                {
                    Attraction: `"Table Mountain Cableway"`,
                    Stop: `"Kloof Nek"`,
                },
            ]);
        });

        test("should NOT find an attraction that is on a different bus route", () => {
            // 1. Define mock facts for the wrong route
            expect(
                mangleDefine("bus_stop_on_route('V&A Waterfront', '104').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Two Oceans Aquarium', 'V&A Waterfront')."
                )
            ).toBeNull();

            // 2. Define the rule
            expect(mangleDefine(rule)).toBeNull();

            // 3. Query and assert (should be null/empty)
            const result = mangleQuery(
                "attraction_is_bus_accessible(Attraction, Stop)"
            );
            expect(JSON.parse(result.trim())).toBeNull();
        });

        test("should return no results if no attraction is near a valid bus stop", () => {
            // 1. Define a valid bus stop, but no attraction linked to it
            expect(
                mangleDefine("bus_stop_on_route('Kloof Nek', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Kirstenbosch Gardens', 'Newlands')."
                )
            ).toBeNull();

            // 2. Define the rule
            expect(mangleDefine(rule)).toBeNull();

            // 3. Query and assert (should be null/empty)
            const result = mangleQuery(
                "attraction_is_bus_accessible(Attraction, Stop)"
            );
            expect(JSON.parse(result.trim())).toBeNull();
        });
    });

    // Test the final rule which depends on the intermediate one: convenient_day_trip
    describe("convenient_day_trip rule", () => {
        const rules = [
            'attraction_is_bus_accessible(Attraction, BusStop) :- attraction_near_location(Attraction, BusStop), bus_stop_on_route(BusStop, "107").',
            "convenient_day_trip(Restaurant, Attraction, BusStop) :- restaurant_near_location(Restaurant, Attraction), attraction_is_bus_accessible(Attraction, BusStop).",
        ];

        test("should deduce a full convenient day trip with a valid chain of facts", () => {
            // 1. Define the complete chain of mock facts
            expect(
                mangleDefine("bus_stop_on_route('Kloof Nek', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Table Mountain Cableway', 'Kloof Nek')."
                )
            ).toBeNull();
            expect(
                mangleDefine(
                    "restaurant_near_location('Table Mountain Cafe', 'Table Mountain Cableway')."
                )
            ).toBeNull();

            // 2. Define the rules
            rules.forEach((r) => expect(mangleDefine(r)).toBeNull());

            // 3. Query and assert
            const result = mangleQuery(
                "convenient_day_trip(Restaurant, Attraction, Stop)"
            );
            expect(JSON.parse(result.trim())).toEqual([
                {
                    Restaurant: `"Table Mountain Cafe"`,
                    Attraction: `"Table Mountain Cableway"`,
                    Stop: `"Kloof Nek"`,
                },
            ]);
        });

        test("should NOT find a trip if the restaurant is not near the bus-accessible attraction", () => {
            // 1. Define a broken chain of facts
            expect(
                mangleDefine("bus_stop_on_route('Kloof Nek', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Table Mountain Cableway', 'Kloof Nek')."
                )
            ).toBeNull();
            // Restaurant is near a different attraction
            expect(
                mangleDefine(
                    "restaurant_near_location('Harbour House', 'V&A Waterfront')."
                )
            ).toBeNull();

            // 2. Define the rules
            rules.forEach((r) => expect(mangleDefine(r)).toBeNull());

            // 3. Query and assert (should be null/empty)
            const result = mangleQuery(
                "convenient_day_trip(Restaurant, Attraction, Stop)"
            );
            expect(JSON.parse(result.trim())).toBeNull();
        });

        test("should find multiple convenient trips if the data supports it", () => {
            // 1. Define facts for two complete, valid trips
            // Trip 1
            expect(
                mangleDefine("bus_stop_on_route('Kloof Nek', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Table Mountain Cableway', 'Kloof Nek')."
                )
            ).toBeNull();
            expect(
                mangleDefine(
                    "restaurant_near_location('Table Mountain Cafe', 'Table Mountain Cableway')."
                )
            ).toBeNull();

            // Trip 2
            expect(
                mangleDefine("bus_stop_on_route('Camps Bay', '107').")
            ).toBeNull();
            expect(
                mangleDefine(
                    "attraction_near_location('Camps Bay Beach', 'Camps Bay')."
                )
            ).toBeNull();
            expect(
                mangleDefine(
                    "restaurant_near_location('The Codfather', 'Camps Bay Beach')."
                )
            ).toBeNull();

            // 2. Define the rules
            rules.forEach((r) => expect(mangleDefine(r)).toBeNull());

            // 3. Query, sort, and assert
            const result = mangleQuery(
                "convenient_day_trip(Restaurant, Attraction, Stop)"
            );
            const sortedResult = sortResults(JSON.parse(result.trim()));

            expect(sortedResult).toEqual([
                {
                    Restaurant: `"The Codfather"`,
                    Attraction: `"Camps Bay Beach"`,
                    Stop: `"Camps Bay"`,
                },
                {
                    Restaurant: `"Table Mountain Cafe"`,
                    Attraction: `"Table Mountain Cableway"`,
                    Stop: `"Kloof Nek"`,
                },
            ]);
        });
    });
});

describe("Gift Planner Schema Tests", () => {
    beforeEach(async () => {
        // Reset the Mangle instance before each test to ensure a clean state
        await runMangleInstance();
    });

    // Mock facts simulating what Gemini Nano would extract from product pages.
    const mockFacts = [
        // Themed Items
        'item_has_theme("Gaming Mouse", "gamer").',
        'item_price("Gaming Mouse", 450).',
        'item_has_theme("LED Keyboard", "gamer").',
        'item_price("LED Keyboard", 500).',
        'item_has_theme("Gaming Headset", "gamer").',
        'item_price("Gaming Headset", 800).',

        // A non-themed item to ensure our rules are specific
        'item_has_theme("Coffee Mug", "kitchen").',
        'item_price("Coffee Mug", 150).',

        // A themed item that is too expensive on its own
        'item_has_theme("Pro Controller", "gamer").',
        'item_price("Pro Controller", 1200).',
    ];

    // --- Rule Definitions ---
    // Rule 1: Find all items that fit the desired theme.
    const themedItemRule =
        'themed_item(Item, Price) :- item_has_theme(Item, "gamer"), item_price(Item, Price).';

    // Rule 2 (Decomposed): Intermediate rule to calculate total price.
    const basketTotalPriceRule =
        "basket_total_price(Item1, Item2, TotalPrice) :- themed_item(Item1, Price1), themed_item(Item2, Price2), Item1 != Item2 |> let TotalPrice = fn:plus(Price1, Price2).";

    // Rule 3 (Decomposed): Final rule to apply the budget constraint.
    const canBuildBasketRule =
        "can_build_basket(Item1, Item2, TotalPrice) :- basket_total_price(Item1, Item2, TotalPrice), TotalPrice < 1000.";

    describe("themed_item rule (Intermediate Deduction)", () => {
        test("should find all items that match the 'gamer' theme", () => {
            mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
            expect(mangleDefine(themedItemRule)).toBeNull();

            const result = mangleQuery("themed_item(Item, Price)");
            const sortedResult = sortResults(JSON.parse(result.trim()));

            expect(sortedResult).toEqual([
                { Item: '"Gaming Headset"', Price: "800" },
                { Item: '"Gaming Mouse"', Price: "450" },
                { Item: '"LED Keyboard"', Price: "500" },
                { Item: '"Pro Controller"', Price: "1200" },
            ]);
        });
    });

    describe("can_build_basket rule (Final Deductive Leap)", () => {
        test("should find the one valid pair of items that fits the budget", () => {
            mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
            expect(mangleDefine(themedItemRule)).toBeNull();
            // Define the chained rules
            expect(mangleDefine(basketTotalPriceRule)).toBeNull();
            expect(mangleDefine(canBuildBasketRule)).toBeNull();

            const result = mangleQuery(
                "can_build_basket(Item1, Item2, TotalPrice)"
            );
            const sortedResult = sortResults(JSON.parse(result.trim()));

            // Only the Mouse (450) + Keyboard (500) = 950 fits under 1000.
            // The result includes both permutations (A,B) and (B,A), which is correct.
            expect(sortedResult).toEqual([
                {
                    Item1: '"Gaming Mouse"',
                    Item2: '"LED Keyboard"',
                    TotalPrice: "950",
                },
                {
                    Item1: '"LED Keyboard"',
                    Item2: '"Gaming Mouse"',
                    TotalPrice: "950",
                },
            ]);
        });

        test("should find multiple valid pairs when several combinations fit the budget", () => {
            // A new set of facts with more low-cost items to create multiple valid pairs
            const mockFactsForMultiple = [
                ...mockFacts, // Includes the original items
                'item_has_theme("Mouse Pad", "gamer").',
                'item_price("Mouse Pad", 150).',
            ];

            mockFactsForMultiple.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(themedItemRule)).toBeNull();
            expect(mangleDefine(basketTotalPriceRule)).toBeNull();
            expect(mangleDefine(canBuildBasketRule)).toBeNull();

            const result = mangleQuery(
                "can_build_basket(Item1, Item2, TotalPrice)"
            );
            const sortedResult = sortResults(JSON.parse(result.trim()));

            // Expected valid pairs (and their permutations) under R1000:
            // Mouse (450) + Keyboard (500) = 950
            // Mouse (450) + Mouse Pad (150) = 600
            // Keyboard (500) + Mouse Pad (150) = 650
            // Headset (800) + Mouse Pad (150) = 950
            expect(sortedResult).toEqual(
                sortResults([
                    {
                        Item1: '"Gaming Mouse"',
                        Item2: '"LED Keyboard"',
                        TotalPrice: "950",
                    },
                    {
                        Item1: '"LED Keyboard"',
                        Item2: '"Gaming Mouse"',
                        TotalPrice: "950",
                    },
                    {
                        Item1: '"Gaming Mouse"',
                        Item2: '"Mouse Pad"',
                        TotalPrice: "600",
                    },
                    {
                        Item1: '"Mouse Pad"',
                        Item2: '"Gaming Mouse"',
                        TotalPrice: "600",
                    },
                    {
                        Item1: '"LED Keyboard"',
                        Item2: '"Mouse Pad"',
                        TotalPrice: "650",
                    },
                    {
                        Item1: '"Mouse Pad"',
                        Item2: '"LED Keyboard"',
                        TotalPrice: "650",
                    },
                    {
                        Item1: '"Gaming Headset"',
                        Item2: '"Mouse Pad"',
                        TotalPrice: "950",
                    },
                    {
                        Item1: '"Mouse Pad"',
                        Item2: '"Gaming Headset"',
                        TotalPrice: "950",
                    },
                ])
            );
        });

        test("should return no results if no pair of items fits the budget", () => {
            // Let's modify the budget constraint to be much smaller
            const stricterCanBuildBasketRule =
                "can_build_basket(Item1, Item2, TotalPrice) :- basket_total_price(Item1, Item2, TotalPrice), TotalPrice < 900.";

            mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
            expect(mangleDefine(themedItemRule)).toBeNull();
            // Define the chained rules with the stricter final rule
            expect(mangleDefine(basketTotalPriceRule)).toBeNull();
            expect(mangleDefine(stricterCanBuildBasketRule)).toBeNull();

            const result = mangleQuery(
                "can_build_basket(Item1, Item2, TotalPrice)"
            );
            // Since the cheapest pair costs 950, a budget of 900 should yield no results.
            expect(JSON.parse(result.trim())).toBeNull();
        });

        test("should not include non-themed items in any potential basket", () => {
            mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
            expect(mangleDefine(themedItemRule)).toBeNull();
            // Define the chained rules
            expect(mangleDefine(basketTotalPriceRule)).toBeNull();
            expect(mangleDefine(canBuildBasketRule)).toBeNull();

            // This query specifically checks if the Coffee Mug was ever considered.
            const result = mangleQuery(
                'can_build_basket("Coffee Mug", Item2, TotalPrice)'
            );

            // It should be null because the "themed_item" rule filters it out from the start.
            expect(JSON.parse(result.trim())).toBeNull();
        });
    });
});
