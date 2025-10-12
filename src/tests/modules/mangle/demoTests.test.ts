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

describe("Hotel Booking Schema Tests", () => {
    beforeEach(async () => {
        await runMangleInstance();
    });

    const mockHotelFacts = [
        'hotel_info("The Grand Hotel", 92, 3500).',
        'hotel_info("Sea View Inn", 85, 2200).',
        'hotel_info("Budget Stay", 71, 1500).',
        'hotel_info("Luxury Suites", 95, 6000).',
        'hotel_location_score("The Grand Hotel", 98).',
        'hotel_location_score("Sea View Inn", 91).',
        'hotel_location_score("Budget Stay", 80).',
        'hotel_location_score("Luxury Suites", 95).',
    ];

    describe("highly_rated_hotel rule", () => {
        const rule =
            "highly_rated_hotel(Name, Rating) :- hotel_info(Name, Rating, _), Rating >= 90.";

        test("should find all hotels with a rating of 90 or higher", () => {
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(rule)).toBeNull();

            const result = mangleQuery("highly_rated_hotel(Name, Rating)");
            const sortedResult = sortResults(JSON.parse(result.trim()));

            expect(sortedResult).toEqual([
                { Name: '"Luxury Suites"', Rating: "95" },
                { Name: '"The Grand Hotel"', Rating: "92" },
            ]);
        });

        test("should return no results if no hotels meet the high rating criteria", () => {
            // Redefine rule with an impossibly high rating requirement
            const veryHighRatingRule =
                "highly_rated_hotel(Name, Rating) :- hotel_info(Name, Rating, _), Rating >= 99.";
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(veryHighRatingRule)).toBeNull();

            const result = mangleQuery("highly_rated_hotel(Name, Rating)");
            expect(JSON.parse(result.trim())).toBeNull();
        });
    });

    describe("good_value_hotel rule", () => {
        // A "good value" hotel has a rating above 80 and costs less than 4000
        const rule =
            "good_value_hotel(Name, Price, Rating) :- hotel_info(Name, Rating, Price), Rating > 80, Price < 4000.";

        test("should find hotels that are both highly rated and within budget", () => {
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(rule)).toBeNull();

            const result = mangleQuery("good_value_hotel(Name, Price, Rating)");
            const sortedResult = sortResults(JSON.parse(result.trim()));

            expect(sortedResult).toEqual([
                { Name: '"Sea View Inn"', Price: "2200", Rating: "85" },
                { Name: '"The Grand Hotel"', Price: "3500", Rating: "92" },
            ]);
        });

        test("should exclude hotels that are cheap but have a low rating", () => {
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(rule)).toBeNull();

            // Specifically query for the 'Budget Stay' hotel
            const result = mangleQuery(
                'good_value_hotel("Budget Stay", Price, Rating)'
            );
            // It should not be found as its rating is 71, which is not > 80
            expect(JSON.parse(result.trim())).toBeNull();
        });

        test("should exclude hotels that are highly rated but too expensive", () => {
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(rule)).toBeNull();

            // Specifically query for the 'Luxury Suites' hotel
            const result = mangleQuery(
                'good_value_hotel("Luxury Suites", Price, Rating)'
            );
            // It should not be found as its price is 6000, which is not < 4000
            expect(JSON.parse(result.trim())).toBeNull();
        });
    });

    describe("best_location_hotel rule", () => {
        // This rule uses aggregation to find the maximum location score and then finds the hotel(s) with that score.
        const rules = [
            "max_location_score(MaxScore) :- hotel_location_score(_, Score) |> do fn:group_by(), let MaxScore = fn:max(Score).",
            "best_location_hotel(Name, LocationScore) :- max_location_score(LocationScore), hotel_location_score(Name, LocationScore).",
        ];

        test("should find the hotel with the absolute best location score", () => {
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            rules.forEach((r) => expect(mangleDefine(r)).toBeNull());

            const result = mangleQuery("best_location_hotel(Name, Score)");
            // The highest score in the mock data is 98
            expect(JSON.parse(result.trim())).toEqual([
                { Name: '"The Grand Hotel"', Score: "98" },
            ]);
        });

        test("should find multiple hotels if they share the top location score", () => {
            const extraFact = 'hotel_location_score("Harbour View", 98).';
            mockHotelFacts.forEach((fact) =>
                expect(mangleDefine(fact)).toBeNull()
            );
            expect(mangleDefine(extraFact)).toBeNull(); // Add the new hotel with the same top score

            rules.forEach((r) => expect(mangleDefine(r)).toBeNull());

            const result = mangleQuery("best_location_hotel(Name, Score)");
            const sortedResult = sortResults(JSON.parse(result.trim()));

            expect(sortedResult).toEqual([
                { Name: '"Harbour View"', Score: "98" },
                { Name: '"The Grand Hotel"', Score: "98" },
            ]);
        });
    });
});
