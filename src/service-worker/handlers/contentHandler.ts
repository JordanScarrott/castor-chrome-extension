import { storageAdapter } from "@/service-worker/storage/storage";
import { ApiContract } from "../../types";
import { geminiNanoService } from "@/service-worker/geminiNano/geminiNanoService";
import { usePrompt } from "@/service-worker/geminiNano/composables/geminiNanoComposable";

const queue: string[] = [];
// Placeholder for your actual processing logic
async function processContent(content: string): Promise<void> {
    console.log(
        `Queueing content for processing: ${content.substring(0, 50)}...`
    );
    queue.push(content);
    const nextTaskContent = queue.pop();
    if (!nextTaskContent) throw Error("Content processing queue empty.");
    console.log(
        `Starting next processing task for text starting with: ${nextTaskContent.substring(
            0,
            50
        )}...`
    );
    await ingestContent(nextTaskContent);
}

export async function handleProcessNewContent(
    payload: ApiContract["PROCESS_NEW_CONTENT"][0]
): Promise<ApiContract["PROCESS_NEW_CONTENT"][1]> {
    try {
        await processContent(payload.content);
        return { status: "QUEUED" };
    } catch (error) {
        return { status: "ERROR", message: (error as Error).message };
    }
}

// TODO: Move to another file
async function ingestContent(content: string): Promise<void> {
    console.log("Summarising content...");
    const summary = await geminiNanoService.summarize(content);
    console.log(`Summary: ${summary}`);

    console.log(
        `Beginnning Manglification of summary ${content.substring(0, 50)}...`
    );
    const mangledData = await usePrompt().prompt(summary);
    console.log(`Mangled Data: ${JSON.stringify(mangledData)}`);
}
