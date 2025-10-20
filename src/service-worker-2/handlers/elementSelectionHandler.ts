import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";
import { StreamingJSONParser } from "@/service-worker-2/utils/StreamingJSONParser";
import { findNewValues } from "@/service-worker-2/utils/findNewValues";
import { debounce, throttle } from "es-toolkit";

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

    const userPrompt = `Please extract all relevant information from the following text:\n`;
    const systemPrompt = `You are a highly accurate data extraction AI. Analyze the user-provided text and populate the given JSON schema with all relevant information. Be precise. If information for a field cannot be found, omit it from the output.`;
    const goalSchema = tourLogisticsSchema;

    const jsonParser = new StreamingJSONParser();
    let fullJsonResponse = "";
    let previousJsonObject: any = null;

    const throttledCreateInsight = throttle(async (currentJson: string) => {
        console.log("🚀 ~ handleElementSelection ~ currentJson:", currentJson);
        const newItems = findNewValues(currentJson, previousJsonObject);
        previousJsonObject = currentJson;

        const item = getFirstPrimitiveValue(newItems);
        if (item) {
            createInsight(item + "", analysisId);
        }
    }, 1500);

    const onRawChunk = (rawChunk: string) => {
        fullJsonResponse += rawChunk;
        const newJsonObject = jsonParser.parse(fullJsonResponse);

        if (newJsonObject) {
            console.log("🚀 ~ onRawChunk ~ newJsonObject:", newJsonObject);
            throttledCreateInsight(newJsonObject);
        }

        // chrome.runtime.sendMessage({
        //     type: "STREAM_UPDATE",
        //     payload: { messageId, chunk: rawChunk, isLast: false },
        // });
    };

    try {
        // 🚀 Pass the goalSchema directly to the API call
        await geminiNanoService.askPromptStreamingBatched(
            html,
            systemPrompt,
            (batchText: string) => userPrompt + batchText,
            onRawChunk,
            {
                schema: goalSchema,
            }
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
            // if (parsedData.tour_name) {
            //     chrome.runtime.sendMessage({
            //         type: "ADD_ANALYSIS_IDEA",
            //         payload: {
            //             analysisId: analysisId,
            //             idea: `Extracted Tour: ${parsedData.tour_name}`,
            //         },
            //     });
            // }
            // if (
            //     parsedData.meeting_points &&
            //     parsedData.meeting_points.length > 0
            // ) {
            //     chrome.runtime.sendMessage({
            //         type: "ADD_ANALYSIS_IDEA",
            //         payload: {
            //             analysisId: analysisId,
            //             idea: `Found ${parsedData.meeting_points.length} meeting point(s).`,
            //         },
            //     });
            // }
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

        // chrome.runtime.sendMessage({
        //     type: "STREAM_UPDATE",
        //     payload: { messageId, chunk: "", isLast: true },
        // });

        // --- Add a final "Analysis complete" message ---
        chrome.runtime.sendMessage({
            type: "ADD_ANALYSIS_IDEA",
            payload: {
                analysisId: analysisId,
                idea: "Analysis complete.",
            },
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

async function createInsight(item: string, analysisId: string): Promise<void> {
    // for (const item of newItems) {
    //     const systemPrompt = `You are a discovery agent announcing new information as it's found. Your announcements must be extremely short (under 5 words) and act as a quick status update. Focus on the most important part of the value. Do not mention JSON keys.`;
    //     const userPrompt = `The following data was just discovered: ${JSON.stringify(
    //         item
    //     )}. Announce this discovery.

    // Examples of good announcements:
    // - For "Winelands Tour", announce: "Found: Winelands Tour"
    // - For {"location_name": "V&A Waterfront"}, announce: "New Location: V&A Waterfront"
    // - For "Wine tasting with Cheese", announce: "Added: Wine tasting"
    // - For "Cost of lunch", announce: "Excludes lunch cost"`;
    //     // const prompt = `${systemPrompt}\n\n${userPrompt}`;
    //     const notificationMessageId = crypto.randomUUID();
    //     // const options = { length: "short", tone: "neutral" };

    //     const insight = await geminiNanoService.write(
    //         systemPrompt,
    //         userPrompt,
    //         notificationMessageId
    //         // options
    //     );

    // const trimmedInsight = insight.split("\n").at(0);
    const trimmedInsight = item;

    chrome.runtime.sendMessage({
        type: "ADD_ANALYSIS_IDEA",
        payload: {
            analysisId: analysisId,
            idea: trimmedInsight || "",
        },
    });
}

/**
 * Recursively traverses a JSON object or array to find the very first
 * primitive value (string, number, boolean, null). It always follows the
 * first key of an object or the first element of an array.
 *
 * @param data The object or array to start searching from.
 * @returns The first primitive value found, or `undefined` if the object is
 * empty, contains only empty structures, or is not a valid object/array.
 */
function getFirstPrimitiveValue(
    data: any
): string | number | boolean | null | undefined {
    // Guard against null, undefined, or primitive inputs.
    if (data === null || typeof data !== "object") {
        return data;
    }

    // Determine if the current data is an array or a plain object.
    const isArray = Array.isArray(data);
    const keysOrIndices = isArray
        ? Object.keys(data).map(Number)
        : Object.keys(data);

    // If the object/array is empty, we can't go deeper.
    if (keysOrIndices.length === 0) {
        return undefined;
    }

    // Get the first element or the value of the first key.
    const firstKeyOrIndex = keysOrIndices[0];
    const nextValue = data[firstKeyOrIndex];

    // This is the recursive step:
    // If the next value is still an object, call the function again.
    // Otherwise, we've found our primitive value.
    if (typeof nextValue === "object" && nextValue !== null) {
        return getFirstPrimitiveValue(nextValue);
    } else {
        return nextValue;
    }
}
