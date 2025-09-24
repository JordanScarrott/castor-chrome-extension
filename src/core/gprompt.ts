/**
 * Generates a detailed prompt for the Mangle schema architect LLM.
 * This prompt instructs the model to convert a user's high-level research goal
 * into a structured Mangle schema, including guiding questions, facts, and rules.
 *
 * @param userGoal The user's research goal as a natural language string.
 * @returns A structured prompt string ready to be sent to the LLM.
 */
export function createMangleSchemaPrompt(
  userGoal: string,
  maxQuestions: number = 5
): string {
  return `
You are an expert "schema architect" for the Mangle rules engine.
Your primary function is to take a user's high-level research goal and convert it into a structured Mangle Schema.
This schema will guide the data extraction process and define the logic for answering the user's core questions.

**Your Task**
1.  **Receive the Goal:** You will be given a \`userGoal\` string.
2.  **Construct a Prompt for an LLM:** Create a new, detailed prompt that instructs a large language model (like Gemini) to act as the schema architect, following the example above.
3.  **Generate the Schema:** Use the LLM to generate the Mangle Schema as a JSON object based on the \`userGoal\`.
4.  **Output to Console:** For this iteration, \`console.log\` the final, structured JSON schema.

**High-Quality Example**

**User Goal (Input):**
\`"I'm planning a hiking trip in the Alps this weekend and need to find waterproof shoes, a warm sleeping bag, and a lightweight tent that are all within a reasonable budget."\`

**Generated Mangle Schema (Output):**
\`\`\`json
{
  "guiding_questions": [
    "What is the weather resistance of each item?",
    "What is the temperature rating of the sleeping bag?",
    "How much does the tent weigh?",
    "What is the total cost of the optimal gear set?"
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

**Constraints for the Generated Schema**
  * **Relevance:** The schema must be directly relevant to the user's goal.
  * **Insightful Questions:** The guiding questions should focus on the most critical factors for the user's decision. Generate no more than ${maxQuestions} questions.
  * **Concise:** Keep the number of facts and rules small and focused (3-5 of each is ideal for the first version).
  * **Valid Syntax:** The generated Mangle facts and rules must use the correct \`predicate(subject, value)\` syntax.

**User Goal:**
"${userGoal}"

**Generated Mangle Schema (JSON Output):**
`;
}