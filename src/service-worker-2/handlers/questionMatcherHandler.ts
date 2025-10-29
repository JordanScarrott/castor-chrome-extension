import { geminiNanoService } from "../geminiNano/geminiNanoService";

export async function handleMatchQuestion(payload: { question: string, queries: Record<string, string> }) {
    const { question, queries } = payload;
    const availableQuestions = Object.values(queries);

    const prompt = `Given the user's question: "${question}", which of the following questions is the best match? ${availableQuestions.join(", ")}. Only return the single best match, exactly as it is written.`;

    try {
        const matchedQuestion = await geminiNanoService.askPrompt(prompt);

        // Find the key (query) for the matched question
        const matchedQuery = Object.keys(queries).find(key => queries[key] === matchedQuestion);

        return matchedQuery;
    } catch (error) {
        console.error("Error matching question:", error);
        return null;
    }
}
