// src/service-worker-2/handlers/elementSelectionHandler.ts

import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";
import { geminiNanoService } from "../geminiNano/geminiNanoService";
import { createStreamingJsonExtractor } from "@/utils/jsonStreamParser";

export async function handleElementSelection(html: string) {
    const messageId = crypto.randomUUID();
    // const schema = {
    //     entities: [
    //         {
    //             entityName: "name of the entity",
    //             relation: "name of the relationship",
    //             targetEntityName: "the other party in the relationship",
    //         },
    //     ],
    // };

    // const userPrompt = `Here is some HTML: ${html}. Please extract the inner text from it, providing only the text content itself.`;
    //     const userPrompt = `Extract facts and relationships from the following text:\n${html}`;
    //     const systemPrompt = `
    // You are a JSON extraction AI. Your task is to extract (entity, relation, target) triples from text. Adhere strictly to the schema. Output only raw JSON.

    // --- EXAMPLE ---

    // CONTEXT:
    // "Tour Starts
    // Meeting points:
    // 08h30 V&A Waterfront: Aquarium Tour office, located office outside the Two Oceans Aquarium
    // 07h50 CBD: Stop 5 Tour office, located at 81 Long Street"

    // ✅ GOOD:
    // {
    //     "entities": [
    //         {
    //             "entityName": "V&A Waterfront: Aquarium Tour office",
    //             "relation": "located_at",
    //             "targetEntityName": "outside the Two Oceans Aquarium"
    //         },
    //         {
    //             "entityName": "V&A Waterfront: Aquarium Tour office",
    //             "relation": "meeting_time",
    //             "targetEntityName": "08h30"
    //         },
    //         {
    //             "entityName": "CBD: Stop 5 Tour office",
    //             "relation": "meeting_time",
    //             "targetEntityName": "07h50"
    //         },
    //         {
    //             "entityName": "CBD: Stop 5 Tour office",
    //             "relation": "located_at",
    //             "targetEntityName": "81 Long Street"
    //         }
    //     ]
    // }

    // ❌ BAD:
    // {
    //     "entities": [
    //         {
    //             "entityName": "V&A Waterfront Meeting Point", // WRONG: Invented entity name
    //             "relation": "has_details", // WRONG: Vague relation
    //             "targetEntityName": "08h30 at Aquarium Tour office, which is outside the Two Oceans Aquarium" // WRONG: Bundles multiple facts
    //         },
    //         {
    //             "entityName": "CBD: Stop 5 Tour office",
    //             "relation": "is_at", // WRONG: Vague relation
    //             "targetEntityName": "81 Long Street at 07h50" // WRONG: Bundles location and time
    //         }
    //     ]
    // }
    // `;

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

    // Example schema for a user wanting tour logistics info
    // A reusable schema for extracting tour logistics
    const tourLogisticsSchema = {
        type: "object",
        properties: {
            tour_name: {
                type: "string",
                description:
                    "The official name of the tour, used as a primary identifier. e.g., 'Winelands Tour'.",
            },
            departure_days: {
                type: "string",
                description:
                    "The days of the week the tour operates, e.g., 'Daily (excluding Sunday)'",
            },
            duration_hours: {
                type: "number",
                description: "The total duration of the tour in hours.",
            },
            meeting_points: {
                type: "array",
                description:
                    "A list of all specified meeting points for the tour.",
                items: {
                    type: "object",
                    properties: {
                        time: {
                            type: "string",
                            description:
                                "The meeting time at this location, e.g., '08h30'.",
                        },
                        location_name: {
                            type: "string",
                            description:
                                "The name of the meeting point, e.g., 'V&A Waterfront: Aquarium Tour office'.",
                        },
                        address_details: {
                            type: "string",
                            description:
                                "Specific location details, e.g., 'outside the Two Oceans Aquarium' or '81 Long Street'.",
                        },
                    },
                },
            },
            end_point: {
                type: "object",
                description: "Details on where and when the tour concludes.",
                properties: {
                    location: {
                        type: "string",
                        description: "The final drop-off location.",
                    },
                    time: {
                        type: "string",
                        description: "The approximate time the tour ends.",
                    },
                },
            },
            inclusions: {
                type: "array",
                description:
                    "A list of all items, services, or fees included in the tour price.",
                items: { type: "string" },
            },
            exclusions: {
                type: "array",
                description:
                    "A list of all items or services explicitly not included.",
                items: { type: "string" },
            },
        },
        required: ["tour_name"], // We need the name to link everything
    };

    const userPrompt = `Please extract all relevant information from the following text:\n${html}`;
    const systemPrompt = `You are a highly accurate data extraction AI. Analyze the user-provided text and populate the given JSON schema with all relevant information. Be precise. If information for a field cannot be found, omit it from the output.`;
    const goalSchema = tourLogisticsSchema;

    let asdf = "";
    // The callback function remains the same
    const onRawChunk = (rawChunk: string) => {
        asdf = asdf + rawChunk;
        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: rawChunk, isLast: false },
        });
    };

    try {
        // 🚀 Pass the goalSchema directly to the API call
        await geminiNanoService.askPromptStreaming(
            userPrompt,
            systemPrompt,
            onRawChunk,
            goalSchema // The schema is now a direct parameter
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
        const translator = new MangleTranslator();
        const asdf_parsed = JSON.parse(asdf);
        console.log("🚀 ~ handleElementSelection ~ asdf_parsed:", asdf_parsed);
        console.log("asdf, ", translator.translate(asdf_parsed, "tour-12345"));

        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: "", isLast: true },
        });
    }
}
