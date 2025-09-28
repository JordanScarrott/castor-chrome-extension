/**
 * Generates a structured prompt for Gemini Nano to create a set of
 * guiding questions based on a user's research goal.
 *
 * @param goal The user's high-level research goal (e.g., "Find a new laptop for programming").
 * @param n The exact number of questions to generate. Defaults to 5.
 * @returns A fully formatted prompt string ready to be sent to the Gemini Nano model.
 */
export function createGuidingQuestionsPrompt(
    goal: string,
    n: number = 5
): string {
    // The core prompt template with clear instructions and examples.
    const promptTemplate = `You are an expert research analyst. Your task is to break down a user's high-level goal into a set of specific, answerable questions. These questions will be used to create a structured knowledge base.

Generate exactly ${n} distinct questions based on the user's goal.

The questions should focus on the key criteria needed to make a decision, such as price, features, compatibility, dimensions, performance, and other objective specifications.

Return the output as a single, valid JSON array of strings. Do not include any other text or explanations.

---
**EXAMPLE 1**
**User Goal:** "Find a new camera for travel photography."
**Output:**
["What is the camera's sensor size?", "What is the total weight including a standard lens?", "Is the camera body weather-sealed?", "What is the CIPA-rated battery life?", "Does it shoot 4K video at 60fps?"]

---
**EXAMPLE 2**
**User Goal:** "Choose a project management tool for my 5-person startup."
**Output:**
["What is the monthly price per user?", "Does the tool offer a Gantt chart view?", "What are the key third-party integrations?", "Is there a free tier available and what are its limitations?", "Does it offer time-tracking features?"]

---
**YOUR TASK**
**User Goal:** "${goal}"
**Output:**
`;

    return promptTemplate;
}

// // --- Example Usage ---
// const userGoal =
//     "Find the best wireless earbuds for running and conference calls under $200.";
// const nanoPrompt = createGuidingQuestionsPrompt(userGoal, 4);

// console.log(nanoPrompt);
