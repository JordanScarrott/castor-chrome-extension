/**
 * This file defines the definitive JSON Schema for the MangleProgramType.
 * It is derived directly from MangleSchema.ts and is used to configure
 * the Gemini API's output format.
 *
 * The descriptions are instructional, guiding the AI to produce a valid
 * IR that is compatible with the MangleQueryBuilder (e.g., variables
 * MUST start with a '?').
 */

// A reusable definition for a single MangleTerm
const mangleTermSchema = {
    oneOf: [
        {
            type: "string",
            description:
                "A string literal (e.g., 'blue') or a variable (e.g., '?Color').",
        },
        { type: "number" },
        { type: "boolean" },
    ],
};

// A reusable definition for an AtomClause
const atomClauseSchema = {
    type: "object",
    properties: {
        type: {
            type: "string",
            enum: ["atom"],
            description: "A predicate clause.",
        },
        predicate: {
            type: "string",
            description: "The name of the predicate for this atom.",
        },
        args: {
            type: "array",
            items: mangleTermSchema,
            description:
                "Arguments for the predicate. Variables MUST start with '?' (e.g., '?HID'). String literals should be plain strings (e.g., 'blue').",
        },
        isNegated: {
            type: "boolean",
            description: "If true, this atom is negated (e.g., !parent(X, Y)).",
        },
    },
    required: ["type", "predicate", "args"],
};

// A reusable definition for a ComparisonClause
const comparisonClauseSchema = {
    type: "object",
    properties: {
        type: {
            type: "string",
            enum: ["comparison"],
            description: "A comparison clause.",
        },
        variable: {
            type: "string",
            description:
                "The variable for the comparison. MUST start with '?' (e.g., '?Price').",
        },
        operator: {
            type: "string",
            enum: ["<", ">", "<=", ">=", "==", "!="],
            description: "The comparison operator.",
        },
        value: {
            ...mangleTermSchema,
            description:
                "The literal value (string, number, bool) to compare against.",
        },
    },
    required: ["type", "variable", "operator", "value"],
};

// The main schema definition
export const MangleGenerationSchema = {
    type: "object",
    properties: {
        rules: {
            type: "array",
            description: "An array of Mangle rules to define derived logic.",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description:
                            "A short, snake_case name for the rule (e.g., 'cheap_hotel').",
                    },
                    naturalLanguageGoal: {
                        type: "string",
                        description:
                            "A plain English description of what this rule is for (e.g., 'Finds hotels cheaper than $150').",
                    },
                    head: {
                        type: "object",
                        properties: {
                            predicate: {
                                type: "string",
                                description:
                                    "The name of the predicate being defined. Should match the 'name' field.",
                            },
                            args: {
                                type: "array",
                                items: {
                                    type: "string",
                                },
                                description:
                                    "The arguments for the rule head. Each MUST be a variable starting with '?' (e.g., '?HID').",
                            },
                        },
                        required: ["predicate", "args"],
                    },
                    body: {
                        type: "array",
                        description:
                            "The list of clauses that must be true for the head to be true.",
                        items: {
                            oneOf: [atomClauseSchema, comparisonClauseSchema],
                        },
                    },
                },
                required: ["name", "naturalLanguageGoal", "head", "body"],
            },
        },
        queries: {
            type: "array",
            description:
                "An array of one or more queries to run against the facts and rules.",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description:
                            "A short, unique, snake_case name for this specific query.",
                    },
                    description: {
                        type: "string",
                        description:
                            "A plain English description of what this query finds.",
                    },
                    find: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                        description:
                            "A list of variables to return in the result. Each MUST start with '?' (e.g., '?Name').",
                    },
                    where: {
                        type: "array",
                        description:
                            "The list of atom clauses that must be satisfied. This section CANNOT contain comparison clauses.",
                        items: atomClauseSchema, // Note: The 'where' clause in a query only allows AtomClauses.
                    },
                },
                required: ["name", "description", "find", "where"],
            },
        },
    },
    required: ["rules", "queries"],
};
