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

    describe("Rules", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        test("should define and query a simple rule with a single predicate in the body", () => {
            let err = mangleDefine('parent("homer", "bart").');
            expect(err).toBe(null);

            err = mangleDefine("is_father(X) :- parent(X, Y).");
            expect(err).toBe(null);

            const result = mangleQuery("is_father(Father)");
            expect(JSON.parse(result.trim())).toEqual([{ Father: '"homer"' }]);
        });

        test("should handle a rule with multiple conjunctive predicates in the body", () => {
            let err = mangleDefine('product("laptop", "electronics").');
            expect(err).toBe(null);
            err = mangleDefine('in_stock("laptop").');
            expect(err).toBe(null);

            err = mangleDefine(
                'available_electronic(P) :- product(P, "electronics"), in_stock(P).'
            );
            expect(err).toBe(null);

            const result = mangleQuery("available_electronic(Prod)");
            expect(JSON.parse(result.trim())).toEqual([{ Prod: '"laptop"' }]);
        });

        test("should correctly resolve variables between the head and body of a rule", () => {
            let err = mangleDefine('spec("macbook", "cpu-speed", 3.5).');
            expect(err).toBe(null);
            err = mangleDefine('spec("thinkpad", "cpu-speed", 2.8).');
            expect(err).toBe(null);

            err = mangleDefine(
                'fast_laptop(Name) :- spec(Name, "cpu-speed", Speed), Speed > 3.0.'
            );
            expect(err).toBe(null);

            const result = mangleQuery("fast_laptop(LaptopName)");
            expect(JSON.parse(result.trim())).toEqual([
                { LaptopName: '"macbook"' },
            ]);
        });

        test("should support multi-level rule chaining (a rule that depends on another rule)", () => {
            let err = mangleDefine('parent("abraham", "homer").');
            expect(err).toBe(null);
            err = mangleDefine('parent("homer", "bart").');
            expect(err).toBe(null);

            err = mangleDefine("father(F, C) :- parent(F, C).");
            expect(err).toBe(null);

            err = mangleDefine(
                "grandfather(G, C) :- father(G, F), father(F, C)."
            );
            expect(err).toBe(null);

            const result = mangleQuery("grandfather(Grandfather, Grandchild)");
            expect(JSON.parse(result.trim())).toEqual([
                { Grandfather: '"abraham"', Grandchild: '"bart"' },
            ]);
        });

        test("should reject a rule with an unbound variable in the head", () => {
            let err = mangleDefine('person("lisa").');
            expect(err).toBe(null);

            err = mangleDefine("unsafe_rule(X, Y) :- person(X).");
            expect(err).not.toBe(null);
            expect(err?.includes("unbound variable")).toBe(true);
        });

        test("should reject a rule with invalid syntax in the body", () => {
            const err = mangleDefine(
                "invalid_syntax(X) :- parent(X, Y) person(Y)."
            );
            expect(err).not.toBe(null);
            expect(err?.startsWith("Error:")).toBe(true);
        });
    });

    describe("Queries", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        /**
         * Test case 1: Simple Query
         * Purpose: To confirm the most basic data retrieval functionality.
         */
        test("should perform a simple query to retrieve a single fact", () => {
            const defineResult = mangleDefine('product("Laptop", 1200).');
            expect(defineResult).toBeNull();

            const queryResult = mangleQuery("product(Name, Price)");
            const parsedResult = JSON.parse(queryResult);
            expect(parsedResult).toStrictEqual([
                { Name: '"Laptop"', Price: "1200" },
            ]);
        });

        /**
         * Test case 2: Bound Variable Query
         * Purpose: To verify that providing a literal value in a query predicate
         * correctly filters the result set.
         */
        test("should perform a query with a bound variable to filter results", () => {
            // 1. Define a set of facts
            expect(mangleDefine('product("Laptop", 1200).')).toBeNull();
            expect(mangleDefine('product("Mouse", 25).')).toBeNull();
            expect(mangleDefine('product("Keyboard", 75).')).toBeNull();

            // 2. Execute a query with a bound variable
            const queryResult = mangleQuery('product("Mouse", Price)');
            const parsedResult = JSON.parse(queryResult);

            // 3. Assert the result contains only the filtered data
            expect(parsedResult).toStrictEqual([{ Price: "25" }]);
        });

        /**
         * Test case 3: Multiple Unbound Variables
         * Purpose: To ensure the query engine can correctly project and return
         * multiple results for a query with several unbound variables.
         */
        test("should perform a query with multiple unbound variables and sort the results", () => {
            // 1. Define a set of facts
            expect(mangleDefine('spec("p1", "cpu", "i7").')).toBeNull();
            expect(mangleDefine('spec("p1", "ram", "16gb").')).toBeNull();
            expect(mangleDefine('spec("p2", "cpu", "i5").')).toBeNull();
            expect(mangleDefine('spec("p2", "ram", "8gb").')).toBeNull();

            // 2. Execute a query to find the CPU spec for all products
            const queryResult = mangleQuery('spec(Product, "cpu", Value)');
            const parsedResult = JSON.parse(queryResult);

            // 3. Sort the results for a stable comparison
            const sortedResult = sortResults(parsedResult);

            // 4. Assert the sorted result is correct
            expect(sortedResult).toStrictEqual([
                { Product: '"p1"', Value: '"i7"' },
                { Product: '"p2"', Value: '"i5"' },
            ]);
        });

        /**
         * Test case 4: Empty Result Set
         * Purpose: To verify the correct behavior when a valid query is
         * executed but yields no results.
         */
        test("should return an empty result set for a query with no matching facts", () => {
            // 1. Define a fact
            expect(mangleDefine('product("Laptop", 1200).')).toBeNull();

            // 2. Execute a query for a product that does not exist
            const queryResult = mangleQuery('product("Desktop", Price)');
            const parsedResult = JSON.parse(queryResult);

            // 3. Assert the result is an empty array
            expect(parsedResult).toStrictEqual([]);
        });

        /**
         * Test case 5: Syntax Error
         * Purpose: A negative test case to ensure the query parser correctly
         * identifies and reports syntax errors.
         */
        test("should return an error for a syntactically invalid query", () => {
            // 1. Execute a syntactically incorrect query
            const queryResult = mangleQuery("product(Name, Price");

            // 2. Assert that the raw string result indicates an error
            expect(queryResult).not.toBeNull();
            expect(queryResult.startsWith("Error:")).toBe(true);
        });
    });
});
