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

describe("Core Syntax and Semantics", () => {
    // Re-initialize to ensure a clean slate, avoiding state from other tests.
    beforeAll(async () => {
        await runMangleInstance();
    });

    describe("Facts", () => {
        test("should correctly define and query a simple fact with a single-word predicate", () => {
            const err = mangleDefine('product("Laptop", 1200).');
            expect(err).toBe(null);
            const result = mangleQuery("product(Name, Price)");
            expect(JSON.parse(result.trim())).toEqual([
                { Name: '"Laptop"', Price: "1200" },
            ]);
        });

        test("should handle facts with predicates containing underscores", () => {
            const err = mangleDefine(
                'product_category("Electronics", "Computers").'
            );
            expect(err).toBe(null);
            const result = mangleQuery(
                "product_category(Category, SubCategory)"
            );
            expect(JSON.parse(result.trim())).toEqual([
                { Category: '"Electronics"', SubCategory: '"Computers"' },
            ]);
        });

        test("should correctly parse facts with predicates containing hyphens", () => {
            const err = mangleDefine('has_brand("L1", "Dell").');
            expect(err).toBe(null);
            const result = mangleQuery("has_brand(Id, Brand)");
            expect(JSON.parse(result.trim())).toEqual([
                { Id: '"L1"', Brand: '"Dell"' },
            ]);
        });

        test("should handle facts with string literals containing spaces and special characters", () => {
            const err = mangleDefine(
                'review("R1", "This is a great product! (5 stars)").'
            );
            expect(err).toBe(null);
            const result = mangleQuery("review(Id, Text)");
            expect(JSON.parse(result.trim())).toEqual([
                { Id: '"R1"', Text: '"This is a great product! (5 stars)"' },
            ]);
        });

        test("should handle facts with integer and floating-point numeric literals", () => {
            let err = mangleDefine('item_stock("I1", 150).');
            expect(err).toBe(null);
            err = mangleDefine('item_rating("I1", 4.5).');
            expect(err).toBe(null);

            const resultInt = mangleQuery('item_stock("I1", Stock)');
            expect(JSON.parse(resultInt.trim())).toEqual([{ Stock: "150" }]);

            const resultFloat = mangleQuery('item_rating("I1", Rating)');
            expect(JSON.parse(resultFloat.trim())).toEqual([{ Rating: "4.5" }]);
        });

        test("should reject facts that do not end with a period", () => {
            const err = mangleDefine('invalid_fact("test")');
            expect(err).not.toBe(null);
            if (err) {
                expect(err.startsWith("Error:")).toBe(true);
            }
        });

        test("should reject facts with invalid predicate names (e.g., starting with a number)", () => {
            const err = mangleDefine('1st_place("Team A").');
            expect(err).not.toBe(null);
            if (err) {
                expect(err.startsWith("Error:")).toBe(true);
            }
        });
    });
});
