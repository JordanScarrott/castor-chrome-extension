import {
    createManglePrompt,
    MangleSchemaProperties,
} from "@/service-worker/geminiNano/utils/prompts/prompts";
import { geminiNanoService } from "../geminiNanoService";
import { MangleSchema } from "@/types/MangleSchema";

export function usePrompt() {
    async function prompt(
        inputText: string,
        schema: MangleSchema
    ): Promise<string | MangleSchemaProperties> {
        const systemPrompt = createManglePrompt(schema);

        // Assuming 'articleText' contains the text from Readability.js
        const result =
            await geminiNanoService.askPrompt<MangleSchemaProperties>(
                inputText,
                systemPrompt,
                schema
            );

        return result;
    }

    return { prompt };
}
