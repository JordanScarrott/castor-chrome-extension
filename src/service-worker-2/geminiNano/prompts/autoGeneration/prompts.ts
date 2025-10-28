import { ManglePromptSchema } from "@/service-worker-2/mangle/ManglePromptSchema";

export const mangle_userGoal = `Find me a cheap hotel near a bus stop.`;
export const mangle_systemPrompt = `You are an expert Mangle Datalog programmer. Your task is to take a user's goal and break it down into a series of logical rules and a final query. You must generate a JSON object that strictly conforms to the provided schema to define this Mangle program.`;
export const predicate_discovery_sys_prompt = `You are a Data Architect. Your only job is to define a schema of BASE FACTS for a user's goal.

**CRUCIAL RULE:** You MUST ONLY define predicates for raw, observable data (e.g., a hotel's price). You MUST NOT define predicates for derived concepts or rules (e.g., whether a hotel is 'cheap' or 'nearby').

Study this example carefully:

---
**GOAL:** "Find a good, cheap laptop."

**GOOD SCHEMA (BASE FACTS ONLY):**
{
  "baseFactSchema": [
    {
      "predicateName": "laptop_price",
      "arguments": ["LID", "Price"],
      "description": "Links a laptop ID to its price."
    },
    {
      "predicateName": "laptop_rating",
      "arguments": ["LID", "Rating"],
      "description": "Links a laptop ID to its user rating."
    }
  ]
}

**BAD SCHEMA (CONTAINS A RULE):**
{
  "baseFactSchema": [
    {
      "predicateName": "laptop_is_good_value",
      "arguments": ["LID"],
      "description": "This is a DERIVED RULE, not a base fact. Do not include predicates like this."
    }
  ]
}
---

Now, apply this exact thinking to the new user goal. Generate the JSON containing only the "baseFactSchema".
`;

export const rule_definition_sys_prompt = (fact_schema_string = ""): string => {
    return `
System Instructions:
You are an expert Mangle Query Architect. Your task is to translate a user's natural language question into a structured JSON object that strictly adheres to the provided MangleProgram schema. This structured output is the Intermediate Representation (IR) which will be deterministically converted into Mangle code.
Crucial Constraints & Output Format:
1. Output Format: Your response MUST be a single JSON object conforming exactly to the external Mangle Program Schema (which includes rules: MangleRule[] and query: MangleFinalQuery).
2. Mangle Logic: A Mangle rule uses Datalog syntax where the body is a conjunction (AND) of clauses.
3. Variables: All variables MUST start with a question mark (?) (e.g., ?ProductID, ?Price). Crucially, every variable used in a rule's head or the query's find list must appear in a positive (type: "atom", isNegated: false) clause in the body/where list (The Safety Condition).
4. Literals: String literals (e.g., "blue", "laptop") MUST NOT be quoted in the JSON arguments; the downstream builder handles Mangle syntax quoting. Numbers and Booleans should be represented as their native JSON types.
5. Comparisons: Use the comparison type for constraints involving >, <, <=, >=, ==, or !=.
Reference Schema (Base Predicates for General E-Commerce/Comparison Shopping):
Use the following predicates to construct your rules, employing the Entity-Attribute-Value (EAV) pattern for flexible specifications:
• product(?ProductID, ?TabID, ?Name): Core product details.
• price(?ProductID, ?TabID, ?Price, ?Currency): The price of a product from a specific source.
• review_summary(?ProductID, ?TabID, ?AvgScore, ?ReviewCount): Aggregated review data.
• feature(?ProductID, ?TabID, ?FeatureName, ?FeatureValue): Flexible specifications (e.g., feature(?p, ?t, "megapixels", 33.0)).
Input:
The user's natural language question is provided below.
`;
};

export const fact_schema_in_context_learning: string = `You are an expert data architect. Your task is to generate a single JSON Schema that defines the data to be extracted for a user's goal. Your output MUST be only the valid JSON Schema object and nothing else.

This schema will be fed to an extraction AI. The quality of your 'description' fields is critical, as they are the primary instructions for that AI. Be descriptive and precise.

To guide you, here is one **perfect** example and one **poor** example. Follow the pattern of the perfect example.

-----

### \#\# Perfect Example (Good Schema)

This schema is good because its 'description' fields are clear and provide context. It correctly uses 'array' for lists (like 'meeting_points') and nests objects where appropriate.

'''json
{
    "type": "object",
    "properties": {
        "tour_name": {
            "type": "string",
            "description": "The official name of the tour, used as a primary identifier. e.g., 'Winelands Tour'."
        },
        "duration_hours": {
            "type": "number",
            "description": "The total duration of the tour in hours."
        },
        "meeting_points": {
            "type": "array",
            "description": "A list of all specified meeting points for the tour.",
            "items": {
                "type": "object",
                "properties": {
                    "time": {
                        "type": "string",
                        "description": "The meeting time at this location, e.g., '08h30'."
                    },
                    "location_name": {
                        "type": "string",
                        "description": "The name of the meeting point, e.g., 'V&A Waterfront: Aquarium Tour office'."
                    }
                }
            }
        },
        "inclusions": {
            "type": "array",
            "description": "A list of all items, services, or fees included in the tour price.",
            "items": { "type": "string" }
        }
    },
    "required": ["tour_name"]
}
'''

-----

### \#\# Poor Example (Bad Schema)

This schema is bad. Its 'description' fields are lazy and useless ("price"). It uses the wrong type for a numeric value ('price' is a 'string'). It fails to group related items, and instead of an 'array' for features, it uses flat, numbered properties ('feature1'), which is not scalable. **Do not follow this pattern.**

'''json
{
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "name of product"
        },
        "price": {
            "type": "string",
            "description": "price"
        },
        "battery": {
            "type": "number",
            "description": "battery"
        },
        "feature1": {
            "type": "string",
            "description": "a feature"
        },
        "feature2": {
            "type": "string",
            "description": "another feature"
        }
    },
    "required": ["name"]
}
'''
`;

/**
 * This file contains the logic for dynamically building the prompt
 * that will be sent to Gemini to generate a MangleProgram.
 */
/**
 * The static system prompt. Defines role, task, and core constraints.
 * This is minimal and immutable.
 */
const STATIC_SYSTEM_PROMPT = `ROLE: Mangle rule/query generator.
TASK: Convert the user's goal into a JSON object based on the provided fact predicates.
CONSTRAINTS: 1. Use ONLY the predicates from the 'FACTS' list. Do not invent new ones. 2. Output ONLY the valid JSON.`;

/**
 * The static In-Context Learning (ICL) examples.
 * This "shows" the model how to perform the task by providing
 * two "gold-standard" examples.
 *
 * Note: The JSON structure is 100% compliant with your MangleGenerationSchema.ts
 * (e.g., using 'head' and 'args' instead of 'ruleHead' and 'headArguments').
 */
const STATIC_ICL_EXAMPLES_TEMPLATE = `---
**ICL EXAMPLE 1**
---
FACTS:
[
  "product(pid, name)",
  "product_price(pid, price)",
  "product_category(pid, category)"
]

GOAL:
"Find all shirts that cost less than $50."

JSON:
{
  "rules": [
    {
      "name": "cheap_product",
      "naturalLanguageGoal": "Which products cost less than $50?",
      "head": {
        "predicate": "cheap_product",
        "args": [
          "?PID"
        ]
      },
      "body": [
        {
          "type": "atom",
          "predicate": "product_price",
          "args": [
            "?PID",
            "?Price"
          ]
        },
        {
          "type": "comparison",
          "variable": "?Price",
          "operator": "<",
          "value": 50
        }
      ]
    },
    {
      "name": "is_shirt",
      "naturalLanguageGoal": "Which products are shirts?",
      "head": {
        "predicate": "is_shirt",
        "args": [
          "?PID"
        ]
      },
      "body": [
        {
          "type": "atom",
          "predicate": "product_category",
          "args": [
            "?PID",
            "shirt"
          ]
        }
      ]
    }
  ],
  "queries": [
    {
      "name": "find_cheap_shirts",
      "description": "Find the names of all shirts that cost less than $50.",
      "find": [
        "?Name"
      ],
      "where": [
        {
          "type": "atom",
          "predicate": "cheap_product",
          "args": [
            "?PID"
          ]
        },
        {
          "type": "atom",
          "predicate": "is_shirt",
          "args": [
            "?PID"
          ]
        },
        {
          "type": "atom",
          "predicate": "product",
          "args": [
            "?PID",
            "?Name"
          ]
        }
      ]
    }
  ]
}

---
**ICL EXAMPLE 2**
---
FACTS:
[
  "hotel_has_restaurant(hotel_id, restaurant_id)",
  "hotel_walking_distance(hotel_id, distance_in_km)"
]

GOAL:
"Help me find hotels with good restaurants that are within walking distance of a bus stop."

JSON:
{
  "rules": [
    {
      "name": "hotel_with_restaurant",
      "naturalLanguageGoal": "Which hotels have a restaurant?",
      "head": {
        "predicate": "hotel_with_restaurant",
        "args": [
          "?HID"
        ]
      },
      "body": [
        {
          "type": "atom",
          "predicate": "hotel_has_restaurant",
          "args": [
            "?HID",
            "?RID"
          ]
        }
      ]
    },
    {
      "name": "hotel_is_walkable",
      "naturalLanguageGoal": "Which hotels are within walking distance (assumed < 2km)?",
      "head": {
        "predicate": "hotel_is_walkable",
        "args": [
          "?HID"
        ]
      },
      "body": [
        {
          "type": "atom",
          "predicate": "hotel_walking_distance",
          "args": [
            "?HID",
            "?Dist"
          ]
        },
        {
          "type": "comparison",
          "variable": "?Dist",
          "operator": "<",
          "value": 2
        }
      ]
    }
  ],
  "queries": [
    {
      "name": "find_walkable_hotels_with_restaurants",
      "description": "Find hotels that have a restaurant AND are within walking distance. (Ignores 'good' as it is unmodelable from these facts).",
      "find": [
        "?HID"
      ],
      "where": [
        {
          "type": "atom",
          "predicate": "hotel_with_restaurant",
          "args": [
            "?HID"
          ]
        },
        {
          "type": "atom",
          "predicate": "hotel_is_walkable",
          "args": [
            "?HID"
          ]
        }
      ]
    }
  ]
}
`;

/**
 * Creates a complete system prompt and user prompt for Gemini Nano
 * to generate Mangle rules and queries using an ICL (In-Context Learning) approach.
 *
 * @param factSchemaString A string containing the available base facts,
 * formatted as newline-separated Mangle fact strings
 * (e.g., "fact1(a, b)\nfact2(c, d)").
 * @param userGoal A natural language string describing what the user wants to find.
 * @returns An object containing the static `systemPrompt` and the dynamic `userPrompt`.
 */
export function createMangleRuleQueryPrompts(
    factSchemaString: string,
    userGoal: string
): { systemPrompt: string; userPrompt: string } {
    // 1. Use the static, minimal system prompt.
    const systemPrompt = STATIC_SYSTEM_PROMPT;

    // 2. Parse the newline-separated fact string into an array
    //    and format it as a JSON-style string list for prompt consistency.
    const factsArray = factSchemaString
        .split("\n")
        .filter((f) => f.trim().length > 0); // Remove any empty lines

    const formattedFactsList =
        "[\n" + factsArray.map((f) => `  "${f}"`).join(",\n") + "\n]";

    // 3. Construct the dynamic user prompt.
    //    It contains the ICL examples *first*, followed by the current task.
    const userPrompt = `${STATIC_ICL_EXAMPLES_TEMPLATE}
---
**CURRENT TASK**
---
FACTS:
${formattedFactsList}

GOAL:
"${userGoal}"

JSON:
`;

    // 4. Return the optimized prompt pair
    return { systemPrompt, userPrompt };
}
