import { MangleQueryBuilder } from "@/service-worker-2/mangle/MangleQueryBuilder";
import { MangleProgramType } from "@/service-worker-2/mangle/MangleSchema";
import { describe, test, expect } from "vitest";

// Helper to normalize whitespace for robust comparisons
const normalize = (s: string) => s.replace(/\s+/g, " ").trim();

describe("MangleQueryBuilder with Multiple Queries", () => {
    const multiQueryProgram: MangleProgramType = {
        rules: [
            {
                name: "is_budget_hotel",
                naturalLanguageGoal: "Which hotels have a price under $150?",
                head: { predicate: "is_budget_hotel", args: ["?HID"] },
                body: [
                    {
                        type: "atom",
                        predicate: "hotel_price",
                        args: ["?HID", "?Price"],
                    },
                    {
                        type: "comparison",
                        variable: "?Price",
                        operator: "<",
                        value: 150.0,
                    },
                ],
            },
            {
                name: "hotel_at_bus_stop",
                naturalLanguageGoal:
                    "Which hotels are located at a known bus stop location?",
                head: {
                    predicate: "hotel_at_bus_stop",
                    args: ["?HID", "?RouteID"],
                },
                body: [
                    {
                        type: "atom",
                        predicate: "hotel_location",
                        args: ["?HID", "?Location"],
                    },
                    {
                        type: "atom",
                        predicate: "bus_stop",
                        args: ["?RouteID", "?Location"],
                    },
                ],
            },
        ],
        queries: [
            {
                name: "find_all_budget_hotels",
                description: "Find the names of all budget hotels.",
                find: ["?Name"],
                where: [
                    {
                        type: "atom",
                        predicate: "is_budget_hotel",
                        args: ["?HID"],
                    },
                    {
                        type: "atom",
                        predicate: "hotel_info",
                        args: ["?HID", "?Tab", "?Name"],
                    },
                ],
            },
            {
                name: "find_budget_hotels_near_bus_stop",
                description:
                    "Find the names of budget hotels located near a bus route.",
                find: ["?Name", "?RouteID"],
                where: [
                    {
                        type: "atom",
                        predicate: "is_budget_hotel",
                        args: ["?HID"],
                    },
                    {
                        type: "atom",
                        predicate: "hotel_at_bus_stop",
                        args: ["?HID", "?RouteID"],
                    },
                    {
                        type: "atom",
                        predicate: "hotel_info",
                        args: ["?HID", "?Tab", "?Name"],
                    },
                ],
            },
        ],
    };

    test("should build the correct program for the first named query", () => {
        const builder = new MangleQueryBuilder(multiQueryProgram);
        const result = builder.build("find_all_budget_hotels");

        const expected = `
      is_budget_hotel(HID) :- hotel_price(HID, Price), Price < 150.
      
      hotel_at_bus_stop(HID, RouteID) :- hotel_location(HID, Location), bus_stop(RouteID, Location).
      
      is_budget_hotel(HID), hotel_info(HID, Tab, Name).
    `;

        expect(normalize(result)).toBe(normalize(expected));
    });

    test("should build the correct program for the second named query", () => {
        const builder = new MangleQueryBuilder(multiQueryProgram);
        const result = builder.build("find_budget_hotels_near_bus_stop");

        const expected = `
      is_budget_hotel(HID) :- hotel_price(HID, Price), Price < 150.
      
      hotel_at_bus_stop(HID, RouteID) :- hotel_location(HID, Location), bus_stop(RouteID, Location).

      is_budget_hotel(HID), hotel_at_bus_stop(HID, RouteID), hotel_info(HID, Tab, Name).
    `;

        expect(normalize(result)).toBe(normalize(expected));
    });

    test("should throw an error if the query name does not exist", () => {
        const builder = new MangleQueryBuilder(multiQueryProgram);

        // Wrap the call in a function to test for thrown errors
        const badCall = () => builder.build("non_existent_query");

        expect(badCall).toThrow(Error);
        expect(badCall).toThrow(
            'Query with name "non_existent_query" not found in Mangle program.'
        );
    });

    test("should build correctly with no rules, only a single query", () => {
        const program: MangleProgramType = {
            rules: [],
            queries: [
                {
                    name: "find_all_products",
                    description: "Find every product.",
                    find: ["?Name"],
                    where: [
                        {
                            type: "atom",
                            predicate: "product",
                            args: ["?ID", "?Name"],
                        },
                    ],
                },
            ],
        };

        const builder = new MangleQueryBuilder(program);
        const result = builder.build("find_all_products");
        const expected = "product(ID, Name).";
        expect(normalize(result)).toBe(normalize(expected));
    });

    test("should correctly quote string literals in a query built by name", () => {
        const program: MangleProgramType = {
            rules: [
                {
                    name: "find_blue_items",
                    naturalLanguageGoal: "Find items that have the color blue",
                    head: { predicate: "blue_item", args: ["?Item"] },
                    body: [
                        {
                            type: "atom",
                            predicate: "has_feature",
                            args: ["?Item", "color", "blue"],
                        },
                    ],
                },
            ],
            queries: [
                {
                    name: "get_blue_items",
                    description: "Execute the rule to find blue items",
                    find: ["?Item"],
                    where: [
                        {
                            type: "atom",
                            predicate: "blue_item",
                            args: ["?Item"],
                        },
                    ],
                },
            ],
        };

        const builder = new MangleQueryBuilder(program);
        const result = builder.build("get_blue_items");
        const expected = `
      blue_item(Item) :- has_feature(Item, "color", "blue").

      blue_item(Item).
    `;
        expect(normalize(result)).toBe(normalize(expected));
    });
});
