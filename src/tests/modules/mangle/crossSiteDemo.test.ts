import { runMangleInstance } from "@/tests/modules/mangle/mangleTestUtils";
import { beforeEach, describe, expect, test } from "vitest";

// Declare the globals that the WASM module will expose
declare const Go: any;
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

// Helper function to sort results for comparison.
// This is necessary because the order of results from the mangle query is not guaranteed.
function sortResults<T>(arr: T[]): T[] {
    // Check if arr is null or undefined, return an empty array if so.
    if (!arr) {
        return [];
    }
    return arr.sort((a, b) =>
        JSON.stringify(a).localeCompare(JSON.stringify(b))
    );
}

describe("Stellenbosch Wine Tour Hotel Finder Tests", () => {
    beforeEach(async () => {
        // Reset the Mangle instance before each test to ensure a clean state
        await runMangleInstance();
    });

    // --- Mock Facts ---
    // These facts are derived from the provided HTML files:
    // - bus_route_website.html (for route 'Route 303: Stellenbosch wine tour')
    // - restaurant_blog_site_demo.html (for restaurants and their hotels)
    // - hotel_booking_site_demo.html (for hotel locations and distances)
    const mockFacts = [
        // Bus stops for 'Route 303: Stellenbosch wine tour'
        'bus_stop_on_route("Century City Square", "Route 303: Stellenbosch wine tour").',
        'bus_stop_on_route("Durbanville Wine Route", "Route 303: Stellenbosch wine tour").',
        'bus_stop_on_route("Long Street Exchange", "Route 303: Stellenbosch wine tour").',

        // A bus stop on a *different* route for negative testing
        'bus_stop_on_route("Kloof Street Junction", "Route 101: Downtown Express").',

        // Restaurants and their ratings (from restaurant_blog_site_demo.html)
        // Ratings are multiplied by 10 to be integers (e.g., 4.6 -> 46)
        'restaurant_rating("The Fermented Frog", 46).', // Good rating (>= 45)
        'restaurant_rating("Midnight Noodles", 41).', // Bad rating (< 45)
        'restaurant_rating("The Gilded Spoon", 49).', // Good rating, but no hotel mentioned

        // Restaurants located at hotels (from restaurant_blog_site_demo.html)
        'restaurant_at_hotel("The Fermented Frog", "The Longan Loft").',
        'restaurant_at_hotel("Midnight Noodles", "The Almond Tree").',

        // Hotel locations (simulated from hotel_booking_site_demo.html structure)
        // Distances are in metres (e.g., 0.5km -> 500)
        // Case 1: The Longan Loft - "Good" hotel. Good restaurant, walkable, correct route.
        'hotel_location("The Longan Loft", "Long Street Exchange", 500).',

        // Case 2: The Almond Tree - "Bad" hotel. Bad restaurant, but good location.
        'hotel_location("The Almond Tree", "Durbanville Wine Route", 200).',

        // Case 3: Luxury Suites - "Bad" hotel. Good restaurant, but too far.
        'restaurant_at_hotel("The Gilded Spoon", "Luxury Suites").', // Add this link
        'hotel_location("Luxury Suites", "Long Street Exchange", 3000).',

        // Case 4: Another "Bad" hotel. Walkable, but on the wrong bus route.
        'hotel_location("The Longan Loft", "Kloof Street Junction", 400).',
    ];

    // --- Mangle Rules ---
    // These rules are designed to solve the user's goal step-by-step.
    const rules = [
        // 1. Find all bus stops on the "Stellenbosch wine tour" route.
        'is_wine_tour_stop(BusStop) :- bus_stop_on_route(BusStop, "Route 303: Stellenbosch wine tour").',

        // 2. Find hotels within "walking distance" (defined as <= 1000 metres, or 1.0 km) of those stops.
        "hotel_is_walkable_to_wine_route(Hotel, BusStop) :- hotel_location(Hotel, BusStop, Distance), is_wine_tour_stop(BusStop), Distance <= 1000.",

        // 3. Find "good" restaurants (defined as rating >= 45, or 4.5).
        "is_good_restaurant(Restaurant) :- restaurant_rating(Restaurant, Rating), Rating >= 45.",

        // 4. Find hotels that contain a "good" restaurant.
        "hotel_has_good_restaurant(Hotel, Restaurant) :- restaurant_at_hotel(Restaurant, Hotel), is_good_restaurant(Restaurant).",

        // 5. Final Goal: Find hotels that are *both* walkable to the wine route AND have a good restaurant.
        "find_convenient_hotel(Hotel, Restaurant, BusStop) :- hotel_is_walkable_to_wine_route(Hotel, BusStop), hotel_has_good_restaurant(Hotel, Restaurant).",
    ];

    // --- Test Cases ---

    test("should correctly identify all stops on the wine tour route", () => {
        mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        const result = mangleQuery("is_wine_tour_stop(Stop)");
        const sortedResult = sortResults(JSON.parse(result.trim()));

        expect(sortedResult).toEqual([
            { Stop: '"Century City Square"' },
            { Stop: '"Durbanville Wine Route"' },
            { Stop: '"Long Street Exchange"' },
        ]);
    });

    test("should correctly identify hotels walkable to a wine tour stop", () => {
        mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        const result = mangleQuery(
            "hotel_is_walkable_to_wine_route(Hotel, Stop)"
        );
        const sortedResult = sortResults(JSON.parse(result.trim()));

        expect(sortedResult).toEqual([
            { Hotel: '"The Almond Tree"', Stop: '"Durbanville Wine Route"' },
            { Hotel: '"The Longan Loft"', Stop: '"Long Street Exchange"' },
        ]);
    });

    test("should correctly identify 'good' restaurants based on rating", () => {
        mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        const result = mangleQuery("is_good_restaurant(Resto)");
        const sortedResult = sortResults(JSON.parse(result.trim()));

        expect(sortedResult).toEqual([
            { Resto: '"The Fermented Frog"' },
            { Resto: '"The Gilded Spoon"' },
        ]);
    });

    test("should correctly identify hotels that have a 'good' restaurant", () => {
        mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        const result = mangleQuery("hotel_has_good_restaurant(Hotel, Resto)");
        const sortedResult = sortResults(JSON.parse(result.trim()));

        expect(sortedResult).toEqual([
            { Hotel: '"Luxury Suites"', Resto: '"The Gilded Spoon"' },
            { Hotel: '"The Longan Loft"', Resto: '"The Fermented Frog"' },
        ]);
    });

    test("should find the one hotel that meets all criteria", () => {
        mockFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        // This is the final query that answers the user's goal
        const result = mangleQuery(
            "find_convenient_hotel(Hotel, Restaurant, BusStop)"
        );
        const parsedResult = JSON.parse(result.trim());

        // --- EXPLANATION of the single result ---
        // - "The Longan Loft" is selected.
        // - It has "The Fermented Frog" (Rating 46 >= 45).
        // - It is at "Long Street Exchange" (on the wine route).
        // - It is 500 metres away (<= 1000 metres (1.0km) walking distance).
        // ---
        // - "The Almond Tree" is rejected (restaurant rating 41 is too low).
        // - "Luxury Suites" is rejected (distance 3000 metres (3.0km) is too far).
        expect(parsedResult).toEqual([
            {
                Hotel: '"The Longan Loft"',
                Restaurant: '"The Fermented Frog"',
                BusStop: '"Long Street Exchange"',
            },
        ]);
    });

    test("should return no results if no hotel meets all criteria", () => {
        // Use the same facts, but change one critical fact
        const newFacts = [
            // Filter out the original "good" rating for The Fermented Frog
            ...mockFacts.filter(
                (fact) =>
                    fact !== 'restaurant_rating("The Fermented Frog", 46).'
            ),
            // Add the new "bad" rating
            'restaurant_rating("The Fermented Frog", 40).',
        ];

        newFacts.forEach((fact) => expect(mangleDefine(fact)).toBeNull());
        rules.forEach((rule) => expect(mangleDefine(rule)).toBeNull());

        const result = mangleQuery(
            "find_convenient_hotel(Hotel, Restaurant, BusStop)"
        );
        // With The Fermented Frog's rating now at 40, no hotel qualifies.
        expect(JSON.parse(result.trim())).toBeNull();
    });
});
