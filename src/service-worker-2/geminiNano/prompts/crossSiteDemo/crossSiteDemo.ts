/**
 * Defines the JSON schema for the generative model.
 * This schema instructs the model to return an object where each key
 * corresponds to a Mangle predicate, and the value is an array of
 * pre-formatted Mangle fact strings.
 */
const geminiJsonSchema = {
    type: "object",
    properties: {
        bus_stop_on_route: {
            type: "array",
            description:
                "A list of 'bus_stop_on_route' facts. If none are found, return an empty array.",
            items: {
                type: "string",
                description:
                    'A Mangle fact string in the format: bus_stop_on_route("stop_name", "route_name").',
            },
        },
        restaurant_rating: {
            type: "array",
            description:
                "A list of 'restaurant_rating' facts. If none are found, return an empty array.",
            items: {
                type: "string",
                description:
                    'A Mangle fact string in the format: restaurant_rating("restaurant_name", RATING). RATING must be an integer (e.g., a 4.6 rating becomes 46).',
            },
        },
        restaurant_at_hotel: {
            type: "array",
            description:
                "A list of 'restaurant_at_hotel' facts. If none are found, return an empty array.",
            items: {
                type: "string",
                description:
                    'A Mangle fact string in the format: restaurant_at_hotel("restaurant_name", "hotel_name").',
            },
        },
        hotel_location: {
            type: "array",
            description:
                "A list of 'hotel_location' facts. If none are found, return an empty array.",
            items: {
                type: "string",
                description:
                    'A Mangle fact string in the format: hotel_location("hotel_name", "bus_stop_name", METRES). METRES must be an integer (e.g., 0.5km becomes 500).',
            },
        },
    },
};

/**
 * Defines the system prompt (or "system instruction") for the model.
 * This sets the model's persona and the hard rules it must follow.
 */
const systemPrompt = `You are an expert Mangle fact generator. Your sole purpose is to parse the provided text and convert extracted data into a list of Mangle fact strings, outputting them *only* in a JSON format that strictly adheres to the user-provided schema.

**CRITICAL RULES:**

1.  **Parse, Don't Infer:** Only extract data that is **explicitly present** in the provided text. Do not make assumptions or use outside knowledge.
2.  **Follow Schema:** The output MUST be a valid JSON object. The keys of this object are the predicate names, and the values are arrays of strings.
3.  **Empty Arrays:** If no data is found for a specific predicate (e.g., the text contains bus stops but no \`hotel_location\` data), you **MUST** return an empty array \`[]\` for that predicate's key. Do **NOT** invent data.
4.  **Mangle Fact Formatting:** You MUST format each string in the output arrays as a valid Mangle fact.
    * **Syntax:** \`predicate_name("string_value_1", "string_value_2", number_value).\`
    * **Strings:** MUST be enclosed in double quotes (\`"\`).
    * **Numbers:** MUST be integers. Do NOT enclose them in quotes.
    * **Period:** Every fact MUST end with a period (\`.\`).
5.  **Data Transformation:**
    * **Ratings:** If you find a rating (e.g., "4.6"), you MUST multiply it by 10 to create an integer (e.g., 46). Use this integer as the number value.
        * Example: \`restaurant_rating("The Fermented Frog", 46).\`
    * **Distances:** If you find a distance in kilometers (e.g., "0.5km"), you MUST convert it to metres (e.g., 500). Use this integer as the number value.
        * Example: \`hotel_location("The Longan Loft", "Long Street Exchange", 500).\`
6.  **Contextual Awareness:**
    * For \`bus_stop_on_route\` facts, the text may first state the route name (e.g., "Route 303: Stellenbosch wine tour Stops") and then list all the stops. You must associate all subsequent stops with that route name.
7.  **Hotel Location Specifics:** Text from a hotel booking page might look like: "Hotel name: The Longan Loft" and "0.5km from Long Street Exchange bus stop", sometimes with the text "directions_bus" nearby.
    * You **MUST** combine these pieces of information.
    * You **MUST** convert the distance to metres (0.5km -> 500).
    * You **MUST** ignore the text "directions_bus"; it is irrelevant.
    * The correct fact **MUST** be: \`hotel_location("The Longan Loft", "Long Street Exchange", 500).\`
    * Do **NOT** create \`bus_stop_on_route\` or \`directions_bus\` facts from this hotel text.`;

/**
 * Defines a template for the user prompt.
 * This is the *prefix* of the prompt. The user must append
 * their HTML content and the closing "\`\`\`text" tag.
 */
const userPromptTemplate = `Please parse the following text content and extract all relevant data into Mangle fact strings, following the schema.

Text Content:

`;

/**
 * A helper type to define the structure of the JSON schema object.
 * This provides type safety if you're using this in a TypeScript project.
 */
export type GeminiJsonSchema = typeof geminiJsonSchema;

/**
 * A helper type for the returned configuration object.
 */
export interface GeminiApiConfig {
    systemPrompt: string;
    jsonSchema: GeminiJsonSchema;
    /**
     * The prefix for the user prompt. You must append your HTML/text
     * content and the closing "\`\`\`text" tag to this string.
     */
    userPrompt: string;
}

/**
 * Returns an object containing all the necessary components for your
 * Gemini API call: the system prompt, the JSON schema, and a
 * function to create the user prompt.
 *
 * @returns {GeminiApiConfig} An object with the API configuration.
 */
export function getGeminiApiConfig(): GeminiApiConfig {
    return {
        systemPrompt,
        jsonSchema: geminiJsonSchema,
        userPrompt: userPromptTemplate,
    };
}
