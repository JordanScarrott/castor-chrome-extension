import { runQueryAndFormatResponse } from "./hotelDataHandler";

export async function handleProcessQuestion(payload: {
    question: string;
    conversationId: number;
}): Promise<void> {
    console.log("🚀 ~ handleProcessQuestion ~ payload:", payload);

    const { question, conversationId } = payload;

    if (!question || typeof question !== "string") {
        throw new Error("Invalid question provided.");
    }

    if (!conversationId || typeof conversationId !== "number") {
        throw new Error("Invalid conversationId provided.");
    }

    try {
        await runQueryAndFormatResponse(question, conversationId);
    } catch (error) {
        console.error("Error processing question:", error);
        // We can't return a response here anymore, as the streaming is handled in the gemini service.
        // We could potentially write an error message to the database.
    }
}
