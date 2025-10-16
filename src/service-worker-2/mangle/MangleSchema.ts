/**
 * A single term in a Mangle atom. Can be a variable (string starting with '?'),
 * a string literal, a number, or a boolean.
 */
export type MangleTerm = string | number | boolean;

/**
 * Represents a comparison clause using a built-in infix operator like '<=' or '!='.
 * Example IR: `{ type: "comparison", variable: "?Price", operator: "<", value: 150 }`
 */
export interface ComparisonClause {
    type: "comparison";
    variable: string;
    operator: "<" | ">" | "<=" | ">=" | "==" | "!=";
    value: MangleTerm;
}

/**
 * Represents a single predicate application (an atom), which can be optionally negated.
 * Example IR: `{ type: "atom", predicate: "hotel_price", args: ["?HID", "?Price"] }`
 */
export interface AtomClause {
    type: "atom";
    predicate: string;
    args: MangleTerm[];
    isNegated?: boolean;
}

/**
 * A union type for any valid clause within the body of a rule.
 */
export type MangleClause = ComparisonClause | AtomClause;

/**
 * Represents a single Mangle rule, which defines a new derived predicate.
 * Includes a natural language description of its purpose.
 */
export interface MangleRule {
    name: string;
    naturalLanguageGoal: string; // Explanation of the rule's purpose
    head: {
        predicate: string;
        args: string[]; // Head arguments must be variables
    };
    body: MangleClause[];
}

/**
 * Defines a final, named query to execute, specifying which variables to find
 * and the conditions that must be met.
 */
export interface MangleFinalQuery {
    name: string; // A unique name to identify this specific query
    description: string;
    find: string[]; // Variables to return in the result set
    where: AtomClause[];
}

/**
 * The top-level structure for a complete Mangle program IR, containing
 * all rules and a set of named queries that can be run against them.
 */
export interface MangleProgram {
    rules: MangleRule[];
    queries: MangleFinalQuery[];
}

/**
 * The primary exported type representing the entire Mangle program IR.
 */
export type MangleProgramType = MangleProgram;
