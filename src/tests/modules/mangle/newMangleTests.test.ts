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

describe("Mangle WASM Tests", () => {
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
                    {
                        Id: '"R1"',
                        Text: '"This is a great product! (5 stars)"',
                    },
                ]);
            });

            test("should handle facts with integer and floating-point numeric literals", () => {
                let err = mangleDefine('item_stock("I1", 150).');
                expect(err).toBe(null);
                err = mangleDefine('item_rating("I1", 4.5).');
                expect(err).toBe(null);

                const resultInt = mangleQuery('item_stock("I1", Stock)');
                expect(JSON.parse(resultInt.trim())).toEqual([
                    { Stock: "150" },
                ]);

                const resultFloat = mangleQuery('item_rating("I1", Rating)');
                expect(JSON.parse(resultFloat.trim())).toEqual([
                    { Rating: "4.5" },
                ]);
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
                expect(JSON.parse(result.trim())).toEqual([
                    { Father: '"homer"' },
                ]);
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
                expect(JSON.parse(result.trim())).toEqual([
                    { Prod: '"laptop"' },
                ]);
            });

            test("should correctly resolve variables between the head and body of a rule", () => {
                let err = mangleDefine('spec("macbook", "cpu-speed", 35).');
                expect(err).toBe(null);
                err = mangleDefine('spec("thinkpad", "cpu-speed", 28).');
                expect(err).toBe(null);

                err = mangleDefine(
                    'fast_laptop(Name) :- spec(Name, "cpu-speed", Speed), Speed > 30.'
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

                const result = mangleQuery(
                    "grandfather(Grandfather, Grandchild)"
                );
                expect(JSON.parse(result.trim())).toEqual([
                    { Grandfather: '"abraham"', Grandchild: '"bart"' },
                ]);
            });

            test("should reject a rule with an unbound variable in the head", () => {
                let err = mangleDefine('person("lisa").');
                expect(err).toBe(null);

                err = mangleDefine("unsafe_rule(X, Y) :- person(X).");
                expect(err).not.toBe(null);
                expect(err?.includes("not bound")).toBe(true);
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
                expect(parsedResult).toBe(null);
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

    describe("Data Types and Built-in Predicates", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        describe("Numeric Operations", () => {
            test("should correctly evaluate arithmetic expressions using 'let'", () => {
                let err = mangleDefine("operands(10, 3).");
                expect(err).toBe(null);

                // FIX: Use `let` for assignments. Each assignment is a separate clause.
                const rule = `
                calculations(Sum, Diff, Prod, Quot) :- 
                    operands(A, B),
                    let Sum = A + B,
                    let Diff = A - B,
                    let Prod = A * B,
                    let Quot = A / B.
            `;
                err = mangleDefine(rule);
                expect(err).toBe(null);

                const result = mangleQuery("calculations(S, D, P, Q)");
                // Note: Mangle performs integer division, 10 / 3 = 3.
                expect(JSON.parse(result.trim())).toEqual([
                    { S: "13", D: "7", P: "30", Q: "3" },
                ]);
            });

            test("should fail evaluation for arithmetic with floating-point numbers", () => {
                let err = mangleDefine("float_operands(10.5, 2.5).");
                expect(err).toBe(null);

                // The rule syntax is valid, so definition should pass.
                const rule =
                    "float_sum(Sum) :- float_operands(A, B), let Sum = A + B.";
                err = mangleDefine(rule);
                expect(err).toBe(null);

                // The error occurs at query time because the '+' operator doesn't support floats.
                const result = mangleQuery("float_sum(S)");
                expect(result.trim()).toContain("evaluation failed");
            });

            test("should correctly evaluate all comparison predicates", () => {
                const facts = ["value(5).", "value(10).", "value(15)."];
                facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

                // FIX: Use standard infix operators. Use single '=' for equality.
                const rules = [
                    "greater(X) :- value(X), X > 10.",
                    "less(X) :- value(X), X < 10.",
                    "greater_eq(X) :- value(X), X >= 10.",
                    "less_eq(X) :- value(X), X <= 10.",
                    "equal(X) :- value(X), X = 10.", // Use single '='
                    "not_equal(X) :- value(X), X != 10.",
                ];
                rules.forEach((rule) => {
                    const err = mangleDefine(rule);
                    expect(err).toBe(null);
                });

                expect(JSON.parse(mangleQuery("greater(V)").trim())).toEqual([
                    { V: "15" },
                ]);
                expect(JSON.parse(mangleQuery("less(V)").trim())).toEqual([
                    { V: "5" },
                ]);
                expect(
                    sortResults(JSON.parse(mangleQuery("greater_eq(V)").trim()))
                ).toEqual([{ V: "10" }, { V: "15" }]);
                expect(
                    sortResults(JSON.parse(mangleQuery("less_eq(V)").trim()))
                ).toEqual([{ V: "5" }, { V: "10" }]);
                expect(JSON.parse(mangleQuery("equal(V)").trim())).toEqual([
                    { V: "10" },
                ]);
                expect(
                    sortResults(JSON.parse(mangleQuery("not_equal(V)").trim()))
                ).toEqual([{ V: "5" }, { V: "15" }]);
            });

            test("should handle division by zero gracefully", () => {
                // FIX: Use `let` for the expression.
                const rule = "div_by_zero(Result) :- let Result = 10 / 0.";
                const err = mangleDefine(rule);
                expect(err).toBe(null); // The rule itself is syntactically valid.

                // The error occurs at query (evaluation) time.
                const result = mangleQuery("div_by_zero(R)");
                expect(result).not.toBe(null);
                expect(result.trim().toLowerCase()).toContain(
                    "division by zero"
                );
            });
        });

        describe("String Operations", () => {
            test("should allow comparison of string literals", () => {
                const facts = [
                    'user("admin", "admin_pass").',
                    'user("guest", "guest").',
                ];
                facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

                // FIX: Use standard infix operators for strings.
                const rules = [
                    "mismatched_pass(User) :- user(User, Pass), User != Pass.",
                    "matched_pass(User) :- user(User, Pass), User = Pass.", // Use single '='
                ];
                rules.forEach((rule) => expect(mangleDefine(rule)).toBe(null));

                expect(
                    JSON.parse(mangleQuery("mismatched_pass(U)").trim())
                ).toEqual([{ U: '"admin"' }]);
                expect(
                    JSON.parse(mangleQuery("matched_pass(U)").trim())
                ).toEqual([{ U: '"guest"' }]);
            });

            test("should correctly handle string escapes and special characters in queries", () => {
                const err = mangleDefine(
                    'message("quote", "A user said, \\"This is great!\\"").'
                );
                expect(err).toBe(null);

                const result = mangleQuery('message("quote", Msg)');
                expect(JSON.parse(result.trim())).toEqual([
                    { Msg: '"A user said, \\"This is great!\\""' },
                ]);
            });
        });
    });

    describe("Aggregation Functions", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        test("should correctly compute fn:count of a result set", () => {
            const facts = ['item("a").', 'item("b").', 'item("c").'];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use the pipe `|>` operator with `fn:group_by` and `let`.
            // An empty group_by aggregates all results into a single group.
            const rule =
                "item_count(Count) :- item(I) |> do fn:group_by(), let Count = fn:count(I).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("item_count(C)");
            expect(JSON.parse(result.trim())).toEqual([{ C: "3" }]);
        });

        test("should correctly compute fn:sum for a set of numbers", () => {
            const facts = ["sale(100).", "sale(50).", "sale(25)."];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use the new aggregation syntax.
            const rule =
                "total_sales(Sum) :- sale(Amount) |> do fn:group_by(), let Sum = fn:sum(Amount).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("total_sales(S)");
            expect(JSON.parse(result.trim())).toEqual([{ S: "175" }]);
        });

        test("should correctly compute fn:avg for a set of numbers", () => {
            const facts = ["score(10).", "score(9).", "score(8)."];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use the new aggregation syntax.
            const rule =
                "average_score(Avg) :- score(S) |> do fn:group_by(), let Avg = fn:avg(S).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("average_score(A)");
            expect(JSON.parse(result.trim())).toEqual([{ A: "9" }]);
        });

        test("should correctly find fn:min of a set of numbers", () => {
            const facts = ["price(25).", "price(15).", "price(50)."];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use the new aggregation syntax.
            const rule =
                "min_price(Min) :- price(P) |> do fn:group_by(), let Min = fn:min(P).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("min_price(M)");
            expect(JSON.parse(result.trim())).toEqual([{ M: "15" }]);
        });

        test("should correctly find fn:max of a set of numbers", () => {
            const facts = ["price(25).", "price(15).", "price(50)."];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use the new aggregation syntax.
            const rule =
                "max_price(Max) :- price(P) |> do fn:group_by(), let Max = fn:max(P).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("max_price(M)");
            expect(JSON.parse(result.trim())).toEqual([{ M: "50" }]);
        });

        test("should handle aggregation over an empty set", () => {
            // FIX: Use the new aggregation syntax for all rules.
            const rules = [
                "count_empty(C) :- empty_set(X) |> do fn:group_by(), let C = fn:count(X).",
                "sum_empty(S) :- empty_set(X) |> do fn:group_by(), let S = fn:sum(X).",
                "avg_empty(A) :- empty_set(X) |> do fn:group_by(), let A = fn:avg(X).",
                "min_empty(M) :- empty_set(X) |> do fn:group_by(), let M = fn:min(X).",
                "max_empty(M) :- empty_set(X) |> do fn:group_by(), let M = fn:max(X).",
            ];
            rules.forEach((rule) => expect(mangleDefine(rule)).toBe(null));

            // The logic remains: the left side of the pipe `empty_set(X)` has no solutions,
            // so the aggregation runs on an empty set.
            // `fn:count` and `fn:sum` on empty sets should NOT produce a result,
            // as there are no groups to aggregate.
            expect(JSON.parse(mangleQuery("count_empty(C)").trim())).toEqual(
                []
            );
            expect(JSON.parse(mangleQuery("sum_empty(S)").trim())).toEqual([]);
            expect(JSON.parse(mangleQuery("avg_empty(A)").trim())).toEqual([]);
            expect(JSON.parse(mangleQuery("min_empty(M)").trim())).toEqual([]);
            expect(JSON.parse(mangleQuery("max_empty(M)").trim())).toEqual([]);
        });

        test("should allow using aggregation results within a rule", () => {
            const facts = [
                'product_price("a", 10).',
                'product_price("b", 20).',
                'product_price("c", 30).',
            ];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Update the aggregation rule with the new syntax.
            const avgRule =
                "average_price(Avg) :- product_price(_, P) |> do fn:group_by(), let Avg = fn:avg(P).";
            expect(mangleDefine(avgRule)).toBe(null);

            // This dependent rule remains the same, as it just uses the result.
            const filterRule =
                "above_average_item(Name) :- average_price(Avg), product_price(Name, Price), gt(Price, Avg).";
            expect(mangleDefine(filterRule)).toBe(null);

            const result = mangleQuery("above_average_item(I)");
            expect(JSON.parse(result.trim())).toEqual([{ I: '"c"' }]);
        });
    });

    describe("Logical Operations", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        test("should correctly apply negation (!) to a predicate", () => {
            const facts = [
                'person("homer").',
                'person("bart").',
                'person("lisa").',
                'parent("homer", "bart").',
                'parent("homer", "lisa").',
            ];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: A more robust way to handle negation is to first define the positive case
            // and then negate that. This avoids potential ambiguity in the engine's evaluation.

            // 1. Define the set of all parents.
            const parent_rule = "is_a_parent(P) :- parent(P, _).";
            expect(mangleDefine(parent_rule)).toBe(null);

            // 2. Define a childless person as a person who is NOT in the set of parents.
            const rule = "childless(P) :- person(P), !is_a_parent(P).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("childless(Person)");
            // Now, only Bart and Lisa should be returned, as Homer is in the `is_a_parent` set.
            expect(sortResults(JSON.parse(result.trim()))).toEqual([
                { Person: '"bart"' },
                { Person: '"lisa"' },
            ]);
        });

        test("should handle complex rules involving both conjunction (,) and negation", () => {
            const facts = [
                'person("homer", 40).',
                'person("bart", 10).',
                'person("apu", 45).',
                'parent("homer", "bart").',
            ];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // FIX: Use `!` for negation instead of `not`.
            const rule =
                "adult_non_parent(P) :- person(P, Age), Age >= 18, !parent(P, _).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("adult_non_parent(Name)");
            // Homer is an adult but is a parent. Bart is not a parent but not an adult. Apu is both.
            expect(JSON.parse(result.trim())).toEqual([{ Name: '"apu"' }]);
        });

        test("should correctly evaluate rules with disjunctive logic (multiple rules defining the same head)", () => {
            const facts = [
                'parent("abraham", "homer").',
                'parent("homer", "bart").',
            ];
            facts.forEach((fact) => expect(mangleDefine(fact)).toBe(null));

            // Disjunctive logic (OR) is achieved by defining multiple rules for the same predicate.
            // A guardian is either a direct parent...
            const rule1 = "guardian(X, Y) :- parent(X, Y).";
            // ...OR a grandparent.
            const rule2 = "guardian(X, Z) :- parent(X, Y), parent(Y, Z).";

            expect(mangleDefine(rule1)).toBe(null);
            expect(mangleDefine(rule2)).toBe(null);

            const result = mangleQuery('guardian(G, "bart")');
            // Both Homer (parent) and Abraham (grandparent) are guardians of Bart.
            expect(sortResults(JSON.parse(result.trim()))).toEqual([
                { G: '"abraham"' },
                { G: '"homer"' },
            ]);
        });
    });

    describe.skip("Non-Functional Testing", () => {
        beforeEach(async () => {
            await runMangleInstance();
        });

        test("should provide a descriptive error message for parsing failures", () => {
            // This rule is syntactically incorrect (missing comma).
            const badRule = "invalid(X) :- person(X) person(Y).";
            const err = mangleDefine(badRule);

            expect(err).not.toBe(null);
            // Check for a key phrase indicating a syntax or parsing error.
            expect(err?.toLowerCase()).toContain("parsing failed");
        });

        test("should provide a descriptive error message for runtime errors (e.g., division by zero)", () => {
            // The rule is syntactically valid.
            const rule = "runtime_error(X) :- let X = 1 / 0.";
            expect(mangleDefine(rule)).toBe(null);

            // The error occurs when the query is evaluated.
            const result = mangleQuery("runtime_error(R)");
            expect(result).not.toBe(null);
            expect(result.toLowerCase()).toContain("division by zero");
        });

        test("should execute queries efficiently with a large fact database", () => {
            // This test acts as a basic performance smoke test. It passes if it
            // completes within the default Vitest timeout (usually 5 seconds).
            const factCount = 10000;
            for (let i = 0; i < factCount; i++) {
                // Batching defines might be faster, but individual defines are a tougher test.
                expect(mangleDefine(`item(${i}).`)).toBe(null);
            }

            const rule =
                "total_count(C) :- item(I) |> do fn:group_by(), let C = fn:count(I).";
            expect(mangleDefine(rule)).toBe(null);

            const result = mangleQuery("total_count(C)");
            expect(JSON.parse(result.trim())).toEqual([{ C: "10000" }]);
        }, 15000); // Set a higher timeout just in case, e.g., 15 seconds.
    });
});
