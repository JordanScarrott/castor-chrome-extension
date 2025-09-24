/**
 * Generates a detailed, instructional prompt for an LLM to act as a Mangle schema architect.
 * This prompt is heavily "few-shot" trained with examples and explicit constraints to ensure
 * the generated schema is syntactically correct and logically sound for the limited Mangle engine.
 *
 * @param userGoal The user's research goal as a natural language string.
 * @param maxQuestions The maximum number of guiding questions to generate.
 * @returns A structured prompt string ready to be sent to the LLM.
 */
export function createMangleSchemaPrompt(
    userGoal: string,
    maxQuestions: number = 5
): string {
    return `
You are an expert "schema architect" for a specific, simplified rules engine called Mangle.
Your primary function is to take a user's research goal and convert it into a structured Mangle Schema. This schema must be syntactically correct and logically sound for the Mangle engine.

---
### **Mangle Engine Limitations (CRITICAL)**
The Mangle engine has strict limitations. You MUST adhere to them. Your primary goal is to produce a valid schema, even if it means simplifying the user's request.

1.  **NO Arithmetic:** You CANNOT perform calculations like addition, subtraction, multiplication, or division. Rules like \`?ratio is ?protein / ?price\` are INVALID.
2.  **NO Aggregations:** You CANNOT find the maximum, minimum, sum, or average of a set of values. There are no \`max()\`, \`min()\`, or \`sum()\` functions.
3.  **Variable vs. Literal Comparisons ONLY:** Comparison operators (\`<\`, \`>\`, \`<=\`, \`>=\`) can ONLY compare a variable to a fixed, literal value (e.g., \`?price < 1500\`). Comparing two variables (e.g., \`?cost <= ?safe_balance\`) is INVALID.

---
### **The Correct Pattern: Threshold-Based Filtering**
Because of these limitations, you must reframe the user's goal. Instead of finding the single "best" item, your rules should define what makes an item "good enough" by filtering against reasonable, estimated thresholds.

-   **User Goal:** "Find the laptop with the highest RAM."
-   **Your Interpretation:** "Find all laptops that are 'high performance'."

Your rules must define these abstract concepts. The final "optimal" choice is an item that satisfies multiple "good enough" conditions simultaneously.

---
### **High-Quality Example (Correct Implementation)**

This example correctly follows the threshold-based pattern.

**User Goal (Input):**
\`"I'm planning a hiking trip in the Alps and need waterproof shoes, a warm sleeping bag, and a lightweight tent, all within a reasonable budget."\`

**Generated Mangle Schema (Output):**
\`\`\`json
{
  "guiding_questions": [
    "What is the weather resistance of each item?",
    "What is the temperature rating of the sleeping bag?",
    "How much does the tent weigh?",
    "What is the price of each item?"
  ],
  "mangle_facts": [
    "item_is_waterproof(itemName, boolean)",
    "sleeping_bag_temp_rating(itemName, celsius)",
    "tent_weight(itemName, kilograms)",
    "item_cost(itemName, price)"
  ],
  "mangle_rules": [
    "is_suitable_shoe(?item) :- item_is_waterproof(?item, true)",
    "is_suitable_sleeping_bag(?item) :- sleeping_bag_temp_rating(?item, ?rating), ?rating <= 0",
    "is_suitable_tent(?item) :- tent_weight(?item, ?weight), ?weight < 2.5",
    "is_optimal_setup(?shoe, ?bag, ?tent) :- is_suitable_shoe(?shoe), is_suitable_sleeping_bag(?bag), is_suitable_tent(?tent)"
  ]
}
\`\`\`

---
### **Example of What to AVOID (and How to Fix It)**

**User Goal:** "I want to find the whey product with the most protein per 100g for the best price."

**BAD RULE (Incorrect):**
\`"most_protein_per_price(?wheyProduct) :- ..."\`
This is conceptually wrong because it implies finding a maximum value, which Mangle cannot do.

**GOOD RULES (Correct Threshold-Based Alternative):**
\`"is_high_protein(?product) :- protein_content(?product, ?grams), ?grams >= 80"\`
\`"is_good_value(?product) :- price_per_100g(?product, ?price), ?price <= 2.50"\`
\`"is_optimal_choice(?product) :- is_high_protein(?product), is_good_value(?product)"\`
This is correct because it defines "optimal" as meeting two "good enough" thresholds, which is a valid filtering operation.

---
### **Your Task**

Now, generate a Mangle Schema for the following user goal. Generate no more than ${maxQuestions} questions. Remember all constraints and strictly follow the threshold-based pattern. The final rule MUST identify an "optimal_choice" or "suitable_option" by combining several threshold-based filter rules. Ensure the output is a single, valid JSON object and nothing else.

**User Goal:**
"${userGoal}"

**Generated Mangle Schema (JSON Output Only):**
`;
}
