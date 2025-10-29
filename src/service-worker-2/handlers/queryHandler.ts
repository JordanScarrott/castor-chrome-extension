import { formatResponseWithAI } from "@/service-worker-2/geminiNano/geminiNanoService";
import { rehydrateMangleState } from "./elementSelectionHandler";
import { ApiContract } from "../../types";

declare function mangleQuery(text: string): string;

export async function handleExecuteQuery(
    payload: ApiContract["EXECUTE_MANGLE_QUERY"][0],
    tabGroupId: number
): Promise<ApiContract["EXECUTE_MANGLE_QUERY"][1]> {
    try {
        await rehydrateMangleState(tabGroupId);
        const queryResult = mangleQuery(payload.query);
        const parsedResult = JSON.parse(queryResult);
        await formatResponseWithAI(payload.question, parsedResult);
    } catch (error) {
        console.error("Error executing Mangle query:", error);
        // In case of an error, we can still use formatResponseWithAI to inform the user.
        await formatResponseWithAI(payload.question, null);
    }
}
