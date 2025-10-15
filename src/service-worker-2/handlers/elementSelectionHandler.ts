// src/service-worker-2/handlers/elementSelectionHandler.ts

import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";
import { geminiNanoService } from "../geminiNano/geminiNanoService";
import { createStreamingJsonExtractor } from "@/utils/jsonStreamParser";

export async function handleElementSelection(html: string) {
    const messageId = crypto.randomUUID();
    const analysisId = `analysis-${Date.now()}`;

    // --- Start Analysis Card ---
    chrome.runtime.sendMessage({
        type: "START_ANALYSIS",
        payload: {
            analysisId: analysisId,
            topic: "Analyzing selected content...",
        },
    });

    // A simplified schema for this example
    const tourLogisticsSchema = {
        type: "object",
        properties: {
            tour_name: {
                type: "string",
                description:
                    "The official name of the tour, e.g., 'Winelands Tour'.",
            },
            meeting_points: {
                type: "array",
                description: "A list of meeting points.",
                items: {
                    type: "object",
                    properties: {
                        time: { type: "string" },
                        location_name: { type: "string" },
                    },
                },
            },
        },
        required: ["tour_name"],
    };

    const userPrompt = `Please extract all relevant information from the following text:\n${html}`;
    const systemPrompt = `You are a highly accurate data extraction AI. Analyze the user-provided text and populate the given JSON schema with all relevant information. Be precise. If information for a field cannot be found, omit it from the output.`;
    const goalSchema = tourLogisticsSchema;

    let fullJsonResponse = "";
    const onRawChunk = (rawChunk: string) => {
        fullJsonResponse += rawChunk;
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
        try {
            const parsedData = JSON.parse(fullJsonResponse);
            console.log("🚀 ~ handleElementSelection ~ parsedData:", parsedData);
            console.log(
                "Translated Mangle:",
                translator.translate(parsedData, "tour-12345")
            );

            // --- Add Analysis Ideas ---
            if (parsedData.tour_name) {
                chrome.runtime.sendMessage({
                    type: "ADD_ANALYSIS_IDEA",
                    payload: {
                        analysisId: analysisId,
                        idea: `Extracted Tour: ${parsedData.tour_name}`,
                    },
                });
            }
            if (
                parsedData.meeting_points &&
                parsedData.meeting_points.length > 0
            ) {
                chrome.runtime.sendMessage({
                    type: "ADD_ANALYSIS_IDEA",
                    payload: {
                        analysisId: analysisId,
                        idea: `Found ${parsedData.meeting_points.length} meeting point(s).`,
                    },
                });
            }
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", e);
            chrome.runtime.sendMessage({
                type: "ADD_ANALYSIS_IDEA",
                payload: {
                    analysisId: analysisId,
                    idea: `Error: Could not parse the extracted data.`,
                },
            });
        }

        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: "", isLast: true },
        });

        // --- Complete Analysis Card ---
        chrome.runtime.sendMessage({
            type: "COMPLETE_ANALYSIS",
            payload: {
                analysisId: analysisId,
            },
        });
    }
}
