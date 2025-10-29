import { geminiNanoService } from "../geminiNano/geminiNanoService";

export async function handleMatchQuestion_old(payload: {
    question: string;
    queries: Record<string, string>;
}) {
    const { question, queries } = payload;
    const availableQuestions = Object.values(queries);

    const prompt = `Given the user's question: "${question}", which of the following questions is the best match? ${availableQuestions.join(
        ", "
    )}. Only return the single best match, exactly as it is written.`;

    try {
        const matchedQuestion = await geminiNanoService.askPrompt(prompt);

        // Find the key (query) for the matched question
        const matchedQuery = Object.keys(queries).find(
            (key) => queries[key] === matchedQuestion
        );

        return matchedQuery;
    } catch (error) {
        console.error("Error matching question:", error);
        return null;
    }
}

export async function handleMatchQuestion(payload: {
    question: string;
    queries: Record<string, string>;
}) {
    const { question, queries } = payload;
    const availableQuestions = Object.values(queries);

    // This system prompt is the "brains." It teaches Nano HOW to match.
    // It's static and reusable.
    const systemPrompt = `You are a highly accurate intent routing assistant. Your job is to analyze the user's question and find the single best-matching "Predefined Question" from the list provided.

Understand the *semantic meaning* and *goal*. Do not just match keywords.
"Walkable to the wine route" is the same intent as "close to a bus stop on Route 303".

# EXAMPLES
---
User Request: "I need a place with good food."
List: ["Find hotels walkable to the wine route", "Which hotels have a 4.5+ star restaurant?"]
Your Answer:
Which hotels have a 4.5+ star restaurant?
---
User Request: "Find me a hotel on the wine tour that has a great restaurant."
List: ["Find hotels walkable to the wine route with a highly-rated restaurant.", "Which bus stops are on the wine tour?"]
Your Answer:
Find hotels walkable to the wine route with a highly-rated restaurant.
---
User Request: "What's the weather like?"
List: ["Find hotels walkable to the wine route", "Which hotels have a 4.5+ star restaurant?"]
Your Answer:
NO_MATCH
---

Your output MUST be *only* the single best-matching question string, exactly as written, or "NO_MATCH".
`;

    // The user prompt is now just the data, clean and simple.
    const userPrompt = `User Request: "${question}"
List: ${JSON.stringify(availableQuestions)}
Your Answer:`;

    try {
        const matchedQuestionRaw = await geminiNanoService.askPrompt(
            userPrompt,
            systemPrompt
        );
        const matchedQuestion = matchedQuestionRaw.trim(); // Clean up whitespace

        // Find the key (query) for the matched question
        const matchedQuery = Object.keys(queries).find(
            (key) => queries[key] === matchedQuestion
        );

        // Handle the NO_MATCH case
        if (!matchedQuery || matchedQuestion === "NO_MATCH") {
            console.warn(`No match found for: "${question}"`);
            return null;
        }

        return matchedQuery;
    } catch (error) {
        console.error("Error matching question:", error);
        return null;
    }
}
