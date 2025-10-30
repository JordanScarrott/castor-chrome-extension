import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import {
    cross_site_demo_queries,
    cross_site_demo_rules,
} from "@/service-worker-2/geminiNano/prompts/crossSiteDemo/crossSiteDemo";

export async function handleTranslateQueries_old(): Promise<
    Record<string, string>
> {
    const translatedQueries: Record<string, string> = {};

    const systemPrompt =
        "You are a helpful assistant that translates technical queries into simple, natural language questions. The user will provide a Datalog query, and you should rephrase it as a question a non-technical user would ask. Make the question concise and clear.";

    for (const query of cross_site_demo_queries) {
        const userPrompt = `Please translate the following Datalog query into a natural language question: \`${query}\``;
        try {
            const translation = await geminiNanoService.askPrompt(
                userPrompt,
                systemPrompt
            );
            // Basic cleaning of the translation
            translatedQueries[query] = translation.trim().replace(/^"|"$/g, "");
        } catch (error) {
            console.error(`Failed to translate query "${query}":`, error);
            // Fallback to a prettified version of the query itself
            translatedQueries[query] = query
                .replace(/_/g, " ")
                .replace(/\(.*\)/, "");
        }
    }

    return translatedQueries;
}

export async function handleTranslateQueries(): Promise<
    Record<string, string>
> {
    return await handleTranslateQueriesWithArgs(
        cross_site_demo_rules,
        cross_site_demo_queries
    );
}
/**
 * Translates a list of Mangle queries into natural language questions for UI chips,
 * using the corresponding rules to provide context to Gemini Nano.
 * * @param rules - An array of Mangle rule strings.
 * @param queries - An array of Mangle query strings that correspond to the rules.
 * @returns A Promise that resolves to a Record<string, string> mapping the
 * original query string to its new natural language question.
 */
export async function handleTranslateQueriesWithArgs(
    rules: string[],
    queries: string[]
): Promise<Record<string, string>> {
    const translatedQueries: Record<string, string> = {};

    // This system prompt is your "answer key," training Nano on your exact style.
    const systemPrompt = `You are an expert UI writer. Your job is to translate Mangle Datalog logic into a simple, human-readable question for a UI chip.

Your goal is to create a question that asks for a list of results, not a Yes/No answer.

CRITICAL RULES:
Your question MUST start with an action word like "Which", "What", or "Find".
DO NOT write binary (Yes/No) questions that begin with "Is", "Does", or "Are". This is true even if the Mangle rule (e.g., "is_good_restaurant") sounds like a Yes/No check. The user is never asking "Is it true?"; they are asking "Show me the things for which this is true."
You will be given the Mangle rule (the logic) and the query (the action). Use the rule's logic to create a precise, natural-language question. Respond only with the final question.


# EXAMPLES

---
Mangle:
Rule: 'is_wine_tour_stop(BusStop) :- bus_stop_on_route(BusStop, "Route 303").'
Query: 'is_wine_tour_stop(BusStop)'
Question:
Which bus stops are on the wine tour (Route 303)?
---
Mangle:
Rule: 'hotel_is_walkable_to_wine_route(Hotel, BusStop) :- hotel_location(Hotel, BusStop, Distance), is_wine_tour_stop(BusStop), Distance <= 1000.'
Query: 'hotel_is_walkable_to_wine_route(Hotel, Stop)'
Question:
Which hotels are within walking distance (1km) of a wine tour bus stop?
---
Mangle:
Rule: 'is_good_restaurant(Restaurant) :- restaurant_rating(Restaurant, Rating), Rating >= 45.'
Query: 'is_good_restaurant(Restaurant)'
Question:
Which restaurants are highly-rated (4.5+ stars)?
---
Mangle:
Rule: 'hotel_has_good_restaurant(Hotel, Restaurant) :- restaurant_at_hotel(Restaurant, Hotel), is_good_restaurant(Restaurant).'
Query: 'hotel_has_good_restaurant(Hotel, Restaurant)'
Question:
Which hotels have a highly-rated restaurant on-site?
---
Mangle:
Rule: 'find_convenient_hotel(Hotel, Restaurant, BusStop) :- hotel_is_walkable_to_wine_route(Hotel, BusStop), hotel_has_good_restaurant(Hotel, Restaurant).'
Query: 'find_convenient_hotel(Hotel, Restaurant, BusStop)'
Question:
Find hotels that are BOTH walkable to the wine route AND have a highly-rated restaurant.
---`;

    // Iterate over the 'queries' argument
    for (const query of queries) {
        // Find the predicate name (e.g., "is_wine_tour_stop")
        const queryPredicate = query.split("(")[0];

        // Find the matching rule from the 'rules' argument
        const matchingRule = rules.find((rule) =>
            rule.startsWith(queryPredicate)
        );

        if (!matchingRule) {
            console.warn(`No matching rule found for query: ${query}`);
            translatedQueries[query] = queryPredicate.replace(/_/g, " "); // Simple fallback
            continue;
        }

        // This context-rich prompt is built from the arguments
        const userPrompt = `Mangle:
Rule: '${matchingRule}'
Query: '${query}'
Question:`;

        try {
            // Make sure 'geminiNanoService' is available in this scope
            const translation = await geminiNanoService.askPrompt(
                userPrompt,
                systemPrompt
            );

            // Clean the response: remove quotes, newlines, and "Question:" prefix
            let cleanTranslation = translation.trim().replace(/^"|"$/g, "");
            cleanTranslation = cleanTranslation
                .replace(/^Question:\s*/, "")
                .trim();

            translatedQueries[query] = cleanTranslation;
        } catch (error) {
            console.error(`Failed to translate query "${query}":`, error);
            translatedQueries[query] = queryPredicate.replace(/_/g, " "); // Fallback
        }
    }

    console.log("Translated Queries:", translatedQueries);
    return translatedQueries;
}
