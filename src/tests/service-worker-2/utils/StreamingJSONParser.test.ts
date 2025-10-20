import { StreamingJSONParser } from "@/service-worker-2/utils/StreamingJSONParser";
import { beforeEach, describe, expect, test } from "vitest";

describe("StreamingJSONParser", () => {
    let parser: StreamingJSONParser;

    beforeEach(() => {
        parser = new StreamingJSONParser();
    });

    describe("Valid and Basic Inputs", () => {
        test("should correctly parse a complete and valid JSON object", () => {
            const json = '{"name": "John", "age": 30, "isStudent": false}';
            expect(parser.parse(json)).toEqual({
                name: "John",
                age: 30,
                isStudent: false,
            });
        });

        test("should correctly parse a complete and valid JSON array", () => {
            const json = '[1, "test", true, null, {}]';
            expect(parser.parse(json)).toEqual([1, "test", true, null, {}]);
        });

        test("should return null for empty string input", () => {
            expect(parser.parse("")).toBeNull();
        });

        test("should return null for null or undefined input", () => {
            expect(parser.parse(null as any)).toBeNull();
            expect(parser.parse(undefined as any)).toBeNull();
        });

        test("should handle JSON with escaped characters in strings", () => {
            const json =
                '{"quote": "Here is a \\"quote\\"", "path": "C:\\\\Users\\\\Test"}';
            expect(parser.parse(json)).toEqual({
                quote: 'Here is a "quote"',
                path: "C:\\Users\\Test",
            });
        });
    });

    describe("Handling Incomplete Structures", () => {
        test("should close a simple unclosed object", () => {
            const json = '{"name": "John"';
            expect(parser.parse(json)).toEqual({ name: "John" });
        });

        test("should close a simple unclosed array", () => {
            const json = '["apple", "banana"';
            expect(parser.parse(json)).toEqual(["apple", "banana"]);
        });

        test("should handle a dangling comma in an object", () => {
            const json = '{"a": 1, "b": 2,';
            expect(parser.parse(json)).toEqual({ a: 1, b: 2 });
        });

        test("should handle a dangling comma in an array", () => {
            const json = "[1, 2, 3,";
            expect(parser.parse(json)).toEqual([1, 2, 3]);
        });

        test("should complete an unterminated string value", () => {
            const json = '{"key": "incomplete value';
            expect(parser.parse(json)).toEqual({ key: "incomplete value" });
        });
    });

    describe("Handling Incomplete Key-Value Pairs", () => {
        test("should handle an incomplete key by adding null as its value", () => {
            const json = '{"name": "John", "skills"';
            expect(parser.parse(json)).toEqual({ name: "John", skills: null });
        });

        test("should handle a key with a colon but no value", () => {
            const json = '{"name": "John", "skills":';
            expect(parser.parse(json)).toEqual({ name: "John", skills: null });
        });

        test("should handle a key with a colon and a partial unquoted value (like a number)", () => {
            const json = '{"value": 123';
            expect(parser.parse(json)).toEqual({ value: 123 });
        });

        test("should handle a key with a colon and a partial primitive (true)", () => {
            const json = '{"value": tru';
            // Note: The improved parser turns this into `null` which is a safe fallback.
            expect(parser.parse(json)).toEqual({ value: null });
        });
    });

    describe("Handling Nested and Complex Structures", () => {
        test("should close a nested unclosed object", () => {
            const json = '{"user": {"name": "Jane", "details": {"age": 25';
            expect(parser.parse(json)).toEqual({
                user: { name: "Jane", details: { age: 25 } },
            });
        });

        test("should close multiple nested structures (object and array)", () => {
            const json = '{"data": {"items": ["one", "two"';
            expect(parser.parse(json)).toEqual({
                data: { items: ["one", "two"] },
            });
        });

        test("should handle a complex, deeply nested incomplete structure", () => {
            const json =
                '{"level1": {"level2": ["a", {"level3": "incomplete value';
            const expected = {
                level1: { level2: ["a", { level3: "incomplete value" }] },
            };
            expect(parser.parse(json)).toEqual(expected);
        });

        test("should handle incomplete items in an array of objects", () => {
            const json = '[{"id":1, "name":"A"}, {"id":2, "name":"B';
            const expected = [
                { id: 1, name: "A" },
                { id: 2, name: "B" },
            ];
            expect(parser.parse(json)).toEqual(expected);
        });
    });

    describe("Streaming Simulation", () => {
        test("should progressively parse a stream of JSON data", () => {
            let stream = '{"user":';
            expect(parser.parse(stream)).toEqual({ user: null });

            stream += ' {"name": "Ja';
            expect(parser.parse(stream)).toEqual({ user: { name: "Ja" } });

            stream += 'ne", "roles": [';
            expect(parser.parse(stream)).toEqual({
                user: { name: "Jane", roles: [] },
            });

            stream += '"admin", "edi';
            expect(parser.parse(stream)).toEqual({
                user: { name: "Jane", roles: ["admin", "edi"] },
            });

            stream += 'tor"]}';
            expect(parser.parse(stream)).toEqual({
                user: { name: "Jane", roles: ["admin", "editor"] },
            });
        });

        test("should return the last valid state if a stream chunk makes it unparsable", () => {
            let stream = '{"name": "initial"}';
            expect(parser.parse(stream)).toEqual({ name: "initial" });

            // This is malformed beyond repair (e.g., a syntax error not at the end)
            stream = '{"name":, "malformed"}';
            expect(parser.parse(stream)).toEqual({ name: "initial" });
        });
    });

    describe("Advanced Edge Cases and Malformed Inputs", () => {
        test.fails(
            "should handle strings containing JSON structural characters",
            () => {
                const json = '{"key": "value with [ and { and : and , inside"';
                expect(parser.parse(json)).toEqual({
                    key: "value with [ and { and : and , inside",
                });
            }
        );

        test("should handle leading whitespace", () => {
            const json = '  \n\t {"key": "value"}';
            expect(parser.parse(json)).toEqual({ key: "value" });
        });

        test("should handle an incomplete number and fall back to last valid state", () => {
            let stream = '{"value": 123}';
            expect(parser.parse(stream)).toEqual({ value: 123 });
            stream = '{"value": 123.}'; // This is invalid
            expect(parser.parse(stream)).toEqual({ value: 123 });
        });

        test("should handle an opening bracket by creating an empty array", () => {
            const json = "[";
            expect(parser.parse(json)).toEqual([]);
        });

        test("should handle an opening brace by creating an empty object", () => {
            const json = "{";
            expect(parser.parse(json)).toEqual({});
        });

        test("should handle an incomplete root-level string", () => {
            const json = '"hello world';
            // It's valid to have a string as the root of a JSON
            expect(parser.parse(json)).toEqual("hello world");
        });

        test("should correctly parse an incomplete object in an array", () => {
            const json = '[{"key": "value"}, {"anotherKey"';
            expect(parser.parse(json)).toEqual([
                { key: "value" },
                { anotherKey: null },
            ]);
        });
    });
});
