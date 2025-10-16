import { runQueryAndFormatResponse } from "./hotelDataHandler";

export async function handleProcessQuestion(payload: {
    question: string;
    conversationId: number;
}): Promise<void> {
    const { question, conversationId } = payload;
    console.log("🚀 ~ handleProcessQuestion ~ question:", question);

    if (!question || typeof question !== "string") {
        throw new Error("Invalid question provided.");
    }

    try {
        await runQueryAndFormatResponse(question, conversationId);
    } catch (error) {
        console.error("Error processing question:", error);
        // The error is already handled and stored in the DB by the callee
    }
}
