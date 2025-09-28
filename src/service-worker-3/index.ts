import { executeQueryHandler } from "@/service-worker-3/handler/executeQueryHandler";
import { generateMangleSchema } from "@/service-worker-3/handler/generateMangleSchemaHandler";
import { processNewContentHandler } from "@/service-worker-3/handler/processNewContentHandler";
import { resolvePromise } from "@/service-worker-3/promiseUtils";

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message) {
        case "GENERATE_MANGLE_SCHEMA": {
            const { data, error } = await resolvePromise(generateMangleSchema);
            if (error) return sendResponse(data);
            sendResponse({ error: (error as any).message });
        }
        case "PROCESS_NEW_CONTENT": {
            const { data, error } = await resolvePromise(
                processNewContentHandler
            );
            if (error) return sendResponse(data);
            sendResponse({ error: (error as any).message });
        }
        case "EXECUTE_MANGLE_QUERY": {
            const { data, error } = await resolvePromise(executeQueryHandler);
            if (error) return sendResponse(data);
            sendResponse({ error: (error as any).message });
        }
        // case "GET_FACT_STORE_STATE": {
        //     const { data, error } = await resolvePromise(generateMangleSchema);
        //     if (error) return sendResponse(data);
        //     sendResponse({ error: (error as any).message });
        // }
        default: {
            console.warn("Event listener unknown", message);
        }
    }
});
