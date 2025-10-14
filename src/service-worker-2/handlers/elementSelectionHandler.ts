// src/service-worker-2/handlers/elementSelectionHandler.ts

import { geminiNanoService } from "../geminiNano/geminiNanoService";
import { createStreamingJsonExtractor } from "@/utils/jsonStreamParser";

export async function handleElementSelection(html: string) {
    const messageId = crypto.randomUUID();
    const schema = {
        entities: [
            {
                entityName: "name of the entity",
                relation: "name of the relationship",
                targetEntityName: "the other party in the relationship",
            },
        ],
    };

    // const userPrompt = `Here is some HTML: ${html}. Please extract the inner text from it, providing only the text content itself.`;
    const userPrompt = `Extract facts and relationships from the following text:\n${html}`;
    const systemPrompt = `
You are a JSON extraction AI. Your task is to extract (entity, relation, target) triples from text. Adhere strictly to the schema. Output only raw JSON.

--- EXAMPLE ---

CONTEXT:
"Tour Starts
Meeting points:
08h30 V&A Waterfront: Aquarium Tour office, located office outside the Two Oceans Aquarium
07h50 CBD: Stop 5 Tour office, located at 81 Long Street"

✅ GOOD:
{
    "entities": [
        {
            "entityName": "V&A Waterfront: Aquarium Tour office",
            "relation": "located_at",
            "targetEntityName": "outside the Two Oceans Aquarium"
        },
        {
            "entityName": "V&A Waterfront: Aquarium Tour office",
            "relation": "meeting_time",
            "targetEntityName": "08h30"
        },
        {
            "entityName": "CBD: Stop 5 Tour office",
            "relation": "meeting_time",
            "targetEntityName": "07h50"
        },
        {
            "entityName": "CBD: Stop 5 Tour office",
            "relation": "located_at",
            "targetEntityName": "81 Long Street"
        }
    ]
}

❌ BAD:
{
    "entities": [
        {
            "entityName": "V&A Waterfront Meeting Point", // WRONG: Invented entity name
            "relation": "has_details", // WRONG: Vague relation
            "targetEntityName": "08h30 at Aquarium Tour office, which is outside the Two Oceans Aquarium" // WRONG: Bundles multiple facts
        },
        {
            "entityName": "CBD: Stop 5 Tour office",
            "relation": "is_at", // WRONG: Vague relation
            "targetEntityName": "81 Long Street at 07h50" // WRONG: Bundles location and time
        }
    ]
}
`;

    // This callback will be invoked with the clean text chunks from the parser.
    // const onParsedChunk = (textChunk: string) => {
    //     console.log("🚀 ~ onParsedChunk ~ textChunk:", textChunk);
    //     chrome.runtime.sendMessage({
    //         type: "STREAM_UPDATE",
    //         payload: { messageId, chunk: textChunk, isLast: false },
    //     });
    // };

    // Create a new parser instance for this request.
    // const jsonProcessor = createStreamingJsonExtractor(
    //     "extracted_text",
    //     onParsedChunk
    // );

    // This is the raw chunk callback from the Gemini API.
    const onRawChunk = (rawChunk: string) => {
        console.log("🚀 ~ onRawChunk ~ rawChunk:", rawChunk);
        // Feed the raw chunk into our JSON processor.
        // jsonProcessor(rawChunk);
        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: rawChunk, isLast: false },
        });
    };

    try {
        await geminiNanoService.askPromptStreaming(
            userPrompt,
            systemPrompt,
            onRawChunk,
            schema
        );
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
