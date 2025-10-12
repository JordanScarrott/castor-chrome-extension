import { runQueryAndFormatResponse } from "./hotelDataHandler";

export async function handleProcessQuestion(
    question: string
): Promise<{ response: string }> {
    if (!question || typeof question !== "string") {
        throw new Error("Invalid question provided.");
    }

    try {
        const formattedResponse = await runQueryAndFormatResponse(question);
        return { response: formattedResponse };
    } catch (error) {
        console.error("Error processing question:", error);
        return {
            response:
                "I'm sorry, I encountered an error while trying to answer your question.",
        };
    }
}
