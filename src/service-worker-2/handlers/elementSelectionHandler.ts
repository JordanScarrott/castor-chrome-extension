import { db } from "@/db";
import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";

export async function handleElementSelection(payload: {
    html: string;
    conversationId: number;
}) {
    const { html, conversationId } = payload;
    const messageId = crypto.randomUUID();

    // --- Start Analysis Card ---
    const analysisId = await db.analysis.add({
        conversationId,
        topic: "Analyzing selected content...",
        status: "analyzing",
        ideas: [],
    });

    // A simplified schema for this example
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
            console.log(
                "🚀 ~ handleElementSelection ~ parsedData:",
                parsedData
            );
            console.log(
                "Translated Mangle:",
                translator.translate(parsedData, "tour-12345")
            );

            // --- Add Analysis Ideas ---
            const ideas: string[] = [];
            if (parsedData.tour_name) {
                ideas.push(`Extracted Tour: ${parsedData.tour_name}`);
            }
            if (
                parsedData.meeting_points &&
                parsedData.meeting_points.length > 0
            ) {
                ideas.push(`Found ${parsedData.meeting_points.length} meeting point(s).`);
            }
            await db.analysis.update(analysisId, { ideas });
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", e);
            await db.analysis.update(analysisId, {
                ideas: ["Error: Could not parse the extracted data."],
            });
        }

        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: "", isLast: true },
        });

        // --- Complete Analysis Card ---
        await db.analysis.update(analysisId, { status: "complete" });
    }
}
