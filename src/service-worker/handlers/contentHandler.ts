import { ApiContract } from "../../types";
import { geminiNanoService } from "@/service-worker/geminiNano/geminiNanoService";
import { usePrompt } from "@/service-worker/geminiNano/composables/geminiNanoComposable";
import { sessionManager } from "../core/SessionManager";
import { mangleEngine } from "../mangle/MangleEngine";

export async function handleProcessNewContent(
    payload: ApiContract["PROCESS_NEW_CONTENT"][0]
): Promise<ApiContract["PROCESS_NEW_CONTENT"][1]> {
    try {
        const mangleSchema = sessionManager.getMangleSchema();
        if (!mangleSchema) {
            throw new Error("Cannot process content without a Mangle schema.");
        }

        console.log("Summarising content...");
        const summary = await geminiNanoService.summarize(payload.content);
        console.log(`Summary: ${summary}`);

        console.log(
            `Beginnning Manglification of summary ${summary.substring(0, 50)}...`
        );
        const mangledData = await usePrompt().prompt(summary, mangleSchema);
        console.log(`Mangled Data: ${JSON.stringify(mangledData)}`);

        if (typeof mangledData !== 'string') {
            const factsAndRules = [...mangledData.facts, ...mangledData.rules].join('\n');
            await mangleEngine.insert(factsAndRules);
        }

        return { status: "PROCESSED" };
    } catch (error) {
        return { status: "ERROR", message: (error as Error).message };
    }
}
