import { geminiNanoService } from "@/service-worker-2/geminiNano/geminiNanoService";
import { cross_site_demo_queries } from "@/service-worker-2/geminiNano/prompts/crossSiteDemo/crossSiteDemo";

export async function handleTranslateQueries(): Promise<Record<string, string>> {
    const translatedQueries: Record<string, string> = {};

    const systemPrompt = "You are a helpful assistant that translates technical queries into simple, natural language questions. The user will provide a Datalog query, and you should rephrase it as a question a non-technical user would ask. Make the question concise and clear.";

    for (const query of cross_site_demo_queries) {
        const userPrompt = `Please translate the following Datalog query into a natural language question: \`${query}\``;
        try {
            const translation = await geminiNanoService.askPrompt(userPrompt, systemPrompt);
            // Basic cleaning of the translation
            translatedQueries[query] = translation.trim().replace(/^"|"$/g, '');
        } catch (error) {
            console.error(`Failed to translate query "${query}":`, error);
            // Fallback to a prettified version of the query itself
            translatedQueries[query] = query.replace(/_/g, ' ').replace(/\(.*\)/, '');
        }
    }

    return translatedQueries;
}
