// src/service-worker-2/handlers/elementSelectionHandler.ts

import { geminiNanoService } from "../geminiNano/geminiNanoService";
import { createStreamingJsonExtractor } from "@/utils/jsonStreamParser";

export async function handleElementSelection(html: string) {
    const messageId = crypto.randomUUID();
    const schema = {
        "type": "object",
        "properties": {
            "extracted_text": {
                "type": "string"
            }
        }
    };

    const userPrompt = `Here is some HTML: ${html}. Please extract the inner text from it, providing only the text content itself.`;

    // This callback will be invoked with the clean text chunks from the parser.
    const onParsedChunk = (textChunk: string) => {
        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: textChunk, isLast: false },
        });
    };

    // Create a new parser instance for this request.
    const jsonProcessor = createStreamingJsonExtractor("extracted_text", onParsedChunk);

    // This is the raw chunk callback from the Gemini API.
    const onRawChunk = (rawChunk: string) => {
        // Feed the raw chunk into our JSON processor.
        jsonProcessor(rawChunk);
    };

    try {
        await geminiNanoService.askPromptStreaming(userPrompt, undefined, onRawChunk, schema);
    } catch (error) {
        console.error("Error during streaming:", error);
        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: {
                messageId,
                chunk: "I'm sorry, I encountered an error while trying to extract the text.",
                isLast: true,
            },
        });
    } finally {
        // Send the final message to indicate the stream is complete.
        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: "", isLast: true },
        });
    }
}
