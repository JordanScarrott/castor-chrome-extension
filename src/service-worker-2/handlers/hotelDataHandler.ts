import { initializeMangleInstance } from "@/tests/modules/mangle/mangleRunTimeUtils";
import { ApiContract } from "@/types";
import { formatResponseWithAI } from "../geminiNano/geminiNanoService";

export async function handleHotelDataExtraction(
    payload: ApiContract["HOTEL_DATA_EXTRACTED"][0]
): Promise<ApiContract["HOTEL_DATA_EXTRACTED"][1]> {
    console.log(
        "Received hotel data in service worker. Ingesting into mangle",
        payload
    );
    const result = await analyzeHotelData(payload);

    console.log(result);
    return { result };
}

// Ensure the Mangle functions are declared if they are globally available
declare function mangleDefine(text: string): string | null;
declare function mangleQuery(text: string): string;

// 1. Re-define the data structure for clarity
interface HotelInfo {
    name: string | null;
    rating: number | null;
    locationScore: number | null;
    price: number | null;
    // other fields like imageUrl, roomType can exist but won't be used by Mangle
}

// 2. Function to convert scraped data into Mangle facts
/**
 * Creates a Mangle fact for hotel_info if the necessary data is present.
 * @param hotel - A HotelInfo object.
 * @returns A Mangle fact string or null if data is missing.
 */
function createHotelInfoFact(hotel: HotelInfo): string | null {
    if (hotel.name && hotel.rating && hotel.price) {
        const integerRating = Math.round(hotel.rating * 10);
        return `hotel_info("${hotel.name}", ${integerRating}, ${hotel.price}).`;
    }
    return null;
}

/**
 * Creates a Mangle fact for hotel_location_score if the necessary data is present.
 * @param hotel - A HotelInfo object.
 * @returns A Mangle fact string or null if data is missing.
 */
function createHotelLocationScoreFact(hotel: HotelInfo): string | null {
    if (hotel.name && hotel.locationScore) {
        const integerLocationScore = Math.round(hotel.locationScore * 10);
        return `hotel_location_score("${hotel.name}", ${integerLocationScore}).`;
    }
    return null;
}

/**
 * Converts an array of HotelInfo objects into Mangle fact strings.
 * Ratings are multiplied by 10 to be stored as integers.
 * @param hotels - The array of hotel data objects.
 * @returns An array of strings, where each string is a Mangle fact.
 */
export function convertHotelDataToFacts(hotels: HotelInfo[]): string[] {
    const facts: string[] = [];
    for (const hotel of hotels) {
        const infoFact = createHotelInfoFact(hotel);
        if (infoFact) {
            facts.push(infoFact);
        }

        const locationScoreFact = createHotelLocationScoreFact(hotel);
        if (locationScoreFact) {
            facts.push(locationScoreFact);
        }
    }
    return facts;
}

// 3. Define the Mangle rules for hotel analysis
export const hotelRules: string[] = [
    // Finds hotels with a rating of 9.0 (90) or higher
    "highly_rated_hotel(Name, Rating) :- hotel_info(Name, Rating, _), Rating >= 90.",
    // Finds hotels with a rating > 8.0 (80) and a price < 4000
    "good_value_hotel(Name, Price, Rating) :- hotel_info(Name, Rating, Price), Rating > 80, Price < 4000.",
    // Finds the maximum location score across all hotels
    "max_location_score(MaxScore) :- hotel_location_score(_, Score) |> do fn:group_by(), let MaxScore = fn:max(Score).",
    // Finds the hotel(s) that have the maximum location score
    "best_location_hotel(Name, LocationScore) :- max_location_score(LocationScore), hotel_location_score(Name, LocationScore).",
];

// 4. Define the user-facing questions and their corresponding Mangle queries
export const hotelQueries: Record<string, string> = {
    "Which hotels have a rating of 9.0 or higher?":
        "highly_rated_hotel(Name, Rating)",
    "What are the best value hotels (great rating, good price)?":
        "good_value_hotel(Name, Price, Rating)",
    "Which hotel has the best location score?":
        "best_location_hotel(Name, Score)",
};
export const hotelNaturalLanguageQuestions = Object.keys(hotelQueries);

export type QandA = {
    question: string;
    answer: any;
};
// 5. Main orchestrator function
/**
 * Takes raw hotel data, loads it into Mangle, and runs all predefined queries.
 * NOTE: This assumes the Mangle WASM instance is already initialized.
 * @param hotelData - The array of hotel data from the content script.
 * @returns A promise that resolves to an array of question-and-answer objects.
 */
export async function analyzeHotelData(hotelData: HotelInfo[]) {
    await initializeMangleInstance();

    // 1. Prime the predicates by defining dummy facts first.
    // This ensures the schema is known before rules are defined.
    const primeFacts = [
        'hotel_info("dummy", 0, 0).',
        'hotel_location_score("dummy", 0).',
    ];
    for (const fact of primeFacts) {
        const err = mangleDefine(fact);
        if (err) console.error("Mangle prime fact error:", err);
    }

    // Convert the scraped data into facts
    const facts = convertHotelDataToFacts(hotelData);
    console.log("🚀 ~ analyzeHotelData ~ facts:", facts);

    // Save all facts to localStorage
    chrome.storage.local.set({ ["mangle_facts"]: facts });

    // Define all facts and rules in the Mangle engine
    // (You might want to clear the engine first if it's not a fresh instance)
    for (const fact of facts) {
        console.log("Ingesting mangle fact:", fact);
        const err = mangleDefine(fact);
        if (err) console.error("Mangle define fact error:", err);
    }
    for (const rule of hotelRules) {
        console.log("Ingesting mangle rule:", rule);
        const err = mangleDefine(rule);
        if (err) console.error("Mangle define rule error:", err);
    }
    console.log(mangleQuery("hotel_info(Name, Rating, Price)"));
    console.log(mangleQuery("hotel_location_score(Name, Score)"));

    // Run all predefined queries
    const analysisResults: QandA[] = [];
    for (const question in hotelQueries) {
        const query = hotelQueries[question];
        const rawResult = mangleQuery(query);
        const parsedResult = rawResult ? JSON.parse(rawResult.trim()) : null;
        analysisResults.push({ question, answer: parsedResult });
    }

    return analysisResults;
}

export async function runQueryAndFormatResponse(
    questionText: string
): Promise<string> {
    const mangleQueryString = hotelQueries[questionText];
    console.log(
        "🚀 ~ runQueryAndFormatResponse ~ mangleQueryString:",
        mangleQueryString
    );

    let mangleResult: any = null;
    if (mangleQueryString) {
        const rawResult = mangleQuery(mangleQueryString);
        console.log("🚀 ~ runQueryAndFormatResponse ~ rawResult:", rawResult);
        if (rawResult) {
            try {
                mangleResult = JSON.parse(rawResult.trim());
                console.log(
                    "🚀 ~ runQueryAndFormatResponse ~ mangleResult:",
                    mangleResult
                );
            } catch (error) {
                console.error("Failed to parse Mangle result:", error);
                // Result remains null
            }
        }
    }

    // Always call the AI to format the response, even if the result is null
    return await formatResponseWithAI(questionText, mangleResult);
}
