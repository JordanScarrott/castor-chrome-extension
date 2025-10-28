import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import { MangleTranslator } from "@/service-worker-2/mangle/MangleTranslator";
import { StreamingJSONParser } from "@/service-worker-2/utils/StreamingJSONParser";
import { findNewValues } from "@/service-worker-2/utils/findNewValues";
import { throttle } from "es-toolkit";
import { getNamespacedKey } from "@/utils/storageUtils";
import {
    cross_site_demo_queries,
    cross_site_demo_rules,
    ensureFactEndsWithPeriod,
    getGeminiApiConfig,
    MangleFactApiResponse,
} from "@/service-worker-2/geminiNano/prompts/crossSiteDemo/crossSiteDemo";
import { initializeMangleInstance } from "@/tests/modules/mangle/mangleRunTimeUtils";

// Ensure the Mangle functions are declared if they are globally available
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

interface AnalysisState {
    analysisId: string;
    topic: string;
    status: "analyzing" | "complete" | "error";
    ideas: string[];
}

export async function handleElementSelection(html: string, tabGroupId: number) {
    const analysisId = `analysis-${Date.now()}`;
    const storageKey = getNamespacedKey("analysis", tabGroupId);

    const initialState: AnalysisState = {
        analysisId,
        topic: "Analyzing selected content...",
        status: "analyzing",
        ideas: [],
    };

    await chrome.storage.local.set({ [storageKey]: initialState });

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

    const _userPrompt = `Please extract all relevant information from the following text:\n`;
    const _systemPrompt = `You are a highly accurate data extraction AI. Analyze the user-provided text and populate the given JSON schema with all relevant information. Be precise. If information for a field cannot be found, omit it from the output.`;
    const _goalSchema = tourLogisticsSchema;

    const jsonParser = new StreamingJSONParser();
    let fullJsonResponse = "";
    let previousJsonObject: any = null;
    let finishedAnalysing = false;

    const throttledCreateInsight = throttle(async (currentJson: string) => {
        const newItems = findNewValues(currentJson, previousJsonObject);
        previousJsonObject = currentJson;

        const item = getFirstPrimitiveValue(newItems);
        if (item) {
            const currentState = (await chrome.storage.local.get(storageKey))[
                storageKey
            ];
            currentState.ideas.push(item as string);
            await chrome.storage.local.set({ [storageKey]: currentState });
        }

        if (finishedAnalysing) {
            const finalState = (await chrome.storage.local.get(storageKey))[
                storageKey
            ];
            finalState.status = "complete";
            await chrome.storage.local.set({ [storageKey]: finalState });
        }
    }, 1500);

    const onRawChunk = (rawChunk: string) => {
        fullJsonResponse += rawChunk;
        const newJsonObject = jsonParser.parse(fullJsonResponse);

        if (newJsonObject) {
            console.log("🚀 ~ onRawChunk ~ newJsonObject:", newJsonObject);
            throttledCreateInsight(newJsonObject);
        }
    };

    try {
        // 🚀 Pass the goalSchema directly to the API call
        const { userPrompt, jsonSchema, systemPrompt } = getGeminiApiConfig();
        console.log(
            "🚀 ~ handleElementSelection ~ userPrompt, jsonSchema, systemPrompt:",
            userPrompt,
            jsonSchema,
            systemPrompt
        );
        await geminiNanoService.askPromptStreamingBatched(
            html,
            systemPrompt,
            (batchText: string) => userPrompt + batchText,
            onRawChunk,
            {
                schema: jsonSchema,
            }
        );
        // await geminiNanoService.askPromptStreamingBatched(
        //     html,
        //     systemPrompt,
        //     (batchText: string) => userPrompt + batchText,
        //     onRawChunk,
        //     {
        //         schema: goalSchema,
        //     }
        // );
    } catch (error) {
        console.error("Error during streaming:", error);
        const errorState = (await chrome.storage.local.get(storageKey))[
            storageKey
        ];
        errorState.status = "error";
        errorState.ideas.push(
            "I'm sorry, I encountered an error while trying to extract the text."
        );
        await chrome.storage.local.set({ [storageKey]: errorState });
    } finally {
        // const translator = new MangleTranslator();
        // try {
        //     const parsedData = JSON.parse(fullJsonResponse);
        //     console.log(
        //         "🚀 ~ handleElementSelection ~ parsedData:",
        //         parsedData
        //     );
        //     console.log(
        //         "Translated Mangle:",
        //         translator.translate(parsedData, "tour-12345")
        //     );
        // } catch (e) {
        //     console.error("Failed to parse JSON from AI response:", e);
        //     const errorState = (await chrome.storage.local.get(storageKey))[
        //         storageKey
        //     ];
        //     errorState.status = "error";
        //     errorState.ideas.push("Error: Could not parse the extracted data.");
        //     await chrome.storage.local.set({ [storageKey]: errorState });
        // }

        finishedAnalysing = true;
        // This will trigger the final update in the throttled function
        throttledCreateInsight(fullJsonResponse);

        console.log("Logging final output: ", fullJsonResponse);

        await initializeMangleInstance();

        // 1. Prime the predicates by defining dummy facts first.
        // This ensures the schema is known before rules are defined.
        const primeFacts = [
            'bus_stop_on_route("dummy data", "dummy route").',
            'restaurant_rating("dummy hotel", 0).',
            'restaurant_at_hotel("dummy restaurant", "dummy hotel").',
            'hotel_location("dummy hotel", "dumy location", 500).',
            'restaurant_at_hotel("dummy restaurant", "dummy hotel").',
        ];
        for (const fact of primeFacts) {
            const err = mangleDefine(fact);
            if (err) console.error("Mangle prime fact error:", err);
        }

        const finalFacts = JSON.parse(
            fullJsonResponse
        ) as MangleFactApiResponse;

        console.log("🚀 ~ handleElementSelection ~ finalFacts:", finalFacts);

        await ingestMangleFacts(finalFacts.bus_stop_on_route, tabGroupId);
        await ingestMangleFacts(finalFacts.hotel_location, tabGroupId);
        await ingestMangleFacts(finalFacts.restaurant_at_hotel, tabGroupId);
        await ingestMangleFacts(finalFacts.restaurant_rating, tabGroupId);

        // if (!rulesIngested) {
        await ingestMangleRules(cross_site_demo_rules, tabGroupId);
        // }
    }
}

async function ingestMangleFacts(facts: string[], tabGroupId: number): Promise<void> {
    const key = getNamespacedKey("mangle_facts", tabGroupId);
    const existingData = await chrome.storage.local.get(key);
    const existingFacts = existingData[key] || [];

    const newFacts = facts.filter(fact => !existingFacts.includes(fact));

    for (const fact of newFacts) {
        const f = ensureFactEndsWithPeriod(fact);
        console.log("Ingesting mangle fact:", f);
        const err = mangleDefine(f);
        if (err) {
            console.error("Mangle define fact error:", err);
            return; // Stop on error
        }
    }

    if (newFacts.length > 0) {
        const updatedFacts = [...existingFacts, ...newFacts];
        await chrome.storage.local.set({ [key]: updatedFacts });
    }
}

async function ingestMangleRules(rules: string[], tabGroupId: number): Promise<void> {
    const key = getNamespacedKey("mangle_rules", tabGroupId);
    for (const rule of rules) {
        console.log("Ingesting mangle rule:", rule);
        const err = mangleDefine(rule);
        if (err) {
            console.error("Mangle define rule error:", err);
            return; // Stop on error
        }
    }
    await chrome.storage.local.set({ [key]: rules });
    await runMangleQueries(cross_site_demo_queries, tabGroupId);
}

export async function rehydrateMangleState(tabGroupId: number): Promise<void> {
    await initializeMangleInstance();

    const factsKey = getNamespacedKey("mangle_facts", tabGroupId);
    const rulesKey = getNamespacedKey("mangle_rules", tabGroupId);

    const data = await chrome.storage.local.get([factsKey, rulesKey]);
    const facts = data[factsKey] || [];
    const rules = data[rulesKey] || [];

    for (const fact of facts) {
        const err = mangleDefine(fact);
        if (err) console.error("Mangle rehydrate fact error:", err);
    }
    for (const rule of rules) {
        const err = mangleDefine(rule);
        if (err) console.error("Mangle rehydrate rule error:", err);
    }
}

async function runMangleQueries(queries: string[], tabGroupId: number): Promise<void> {
    await rehydrateMangleState(tabGroupId);
    for (const query of queries) {
        const result = mangleQuery(query);
        console.log(`Ran mangle query: ${query}. Result: ${result}`);
    }
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
