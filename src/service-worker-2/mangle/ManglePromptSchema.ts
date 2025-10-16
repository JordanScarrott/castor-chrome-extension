/**
 * This file defines a JSON Schema object that is passed to the Gemini Nano Prompt API.
 * It is designed to be easily understood by the language model, using descriptive
 * field names and providing explicit instructions in the "description" fields.
 * This helps the AI reliably generate a valid MangleProgram IR.
 */
export const ManglePromptSchema = {
    type: "object",
    properties: {
        rules: {
            type: "array",
            description:
                "An array of Mangle rules that define the logic of the program. Each rule should represent a single, reusable logical concept.",
            items: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description:
                            "A short, snake_case name for the rule predicate.",
                    },
                    naturalLanguageGoal: {
                        type: "string",
                        description:
                            "A clear, simple question in plain English that this rule is designed to answer. For example: 'Which hotels are cheaper than $200?'",
                    },
                    ruleHead: {
                        type: "object",
                        description:
                            "The head of the rule, which defines the predicate's name and its arguments.",
                        properties: {
                            predicate: {
                                type: "string",
                                description:
                                    "The name of the predicate being defined. Should match the top-level rule name.",
                            },
                            headArguments: {
                                type: "array",
                                description:
                                    "An array of capitalized variable names used in the rule's head, like 'HID' or 'Price'. These variables must be used in the rule's body.",
                                items: { type: "string" },
                            },
                        },
                        required: ["predicate", "headArguments"],
                    },
                    ruleBody: {
                        type: "array",
                        description:
                            "The body of the rule, containing a list of clauses that must all be true for the head to be true.",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["atom", "comparison"],
                                    description:
                                        "The type of clause: 'atom' for a predicate, or 'comparison' for a math/equality check.",
                                },
                                predicate: {
                                    type: "string",
                                    description:
                                        "Required if type is 'atom'. The name of the predicate to call.",
                                },
                                args: {
                                    type: "array",
                                    description:
                                        "Required if type is 'atom'. The arguments for the predicate, which can be variables (e.g., '?HID') or string/number literals.",
                                    items: {
                                        oneOf: [
                                            { type: "string" },
                                            { type: "number" },
                                            { type: "boolean" },
                                        ],
                                    },
                                },
                                isNegated: {
                                    type: "boolean",
                                    description:
                                        "If true, this 'atom' clause is negated (e.g., !is_a_parent(P)). Defaults to false.",
                                },
                                variable: {
                                    type: "string",
                                    description:
                                        "Required if type is 'comparison'. The variable on the left side of the comparison (e.g., '?Price').",
                                },
                                operator: {
                                    type: "string",
                                    enum: ["<", ">", "<=", ">=", "==", "!="],
                                    description:
                                        "Required if type is 'comparison'. The comparison operator to use.",
                                },
                                value: {
                                    oneOf: [
                                        { type: "string" },
                                        { type: "number" },
                                        { type: "boolean" },
                                    ],
                                    description:
                                        "Required if type is 'comparison'. The value or variable to compare against.",
                                },
                            },
                            required: ["type"],
                        },
                    },
                },
                required: [
                    "name",
                    "naturalLanguageGoal",
                    "ruleHead",
                    "ruleBody",
                ],
            },
        },
        queries: {
            type: "array",
            description:
                "An array of one or more specific questions to ask the system, using the rules defined above.",
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
                            "A plain English description of what this final query is trying to find.",
                    },
                    find: {
                        type: "array",
                        description:
                            "A list of the capitalized variable names you want to get back in the final result. e.g. ['Name', 'Price']",
                        items: { type: "string" },
                    },
                    where: {
                        type: "array",
                        description:
                            "A list of atom clauses that must be satisfied to get a result. These clauses often use the rules defined above.",
                        items: {
                            type: "object",
                            properties: {
                                type: {
                                    type: "string",
                                    enum: ["atom"],
                                    default: "atom",
                                },
                                predicate: {
                                    type: "string",
                                    description:
                                        "The name of a rule or a base fact predicate.",
                                },
                                args: {
                                    type: "array",
                                    description:
                                        "The arguments for the predicate, which can be variables (e.g., '?HID') or literals.",
                                    items: {
                                        oneOf: [
                                            { type: "string" },
                                            { type: "number" },
                                            { type: "boolean" },
                                        ],
                                    },
                                },
                            },
                            required: ["type", "predicate", "args"],
                        },
                    },
                },
                required: ["name", "description", "find", "where"],
            },
        },
    },
    required: ["rules", "queries"],
};
