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
        // const rule =
        //     "attraction_is_bus_accessible(?attraction, ?bus_stop) :- attraction_near_location(?attraction, ?bus_stop), bus_stop_on_route(?bus_stop, '107').";
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
