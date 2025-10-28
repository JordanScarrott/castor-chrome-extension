/**
 * This file defines a simplified JSON Schema for the first prompt to Gemini Nano.
 * Its only purpose is to guide the AI in defining a data model (the base fact predicates)
 * for a given user goal.
 */
export const PredicateDiscoverySchema = {
    type: "object",
    properties: {
        baseFactSchema: {
            type: "array",
            description:
                "An array of base fact predicates that model the core entities required to answer the user's goal.",
            items: {
                type: "object",
                properties: {
                    predicateName: {
                        type: "string",
                        description:
                            'The snake_case name of the fact. Example: "hotel_price" or "bus_stop".',
                    },
                    arguments: {
                        type: "array",
                        description:
                            'An array of capitalized argument names that define the structure of this fact. Example: ["HID", "Price"] or ["RouteID", "LocationID"].',
                        items: { type: "string" },
                    },
                    description: {
                        type: "string",
                        description:
                            'A brief, plain English explanation of what this fact represents. Example: "Links a unique hotel ID to its price per night."',
                    },
                },
                required: ["predicateName", "arguments", "description"],
            },
        },
    },
    required: ["baseFactSchema"],
};
