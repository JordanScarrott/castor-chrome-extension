import {
    createMangleDataPrompt,
    MangleSchemaProperties,
} from "@/service-worker/geminiNano/utils/prompts/prompts";
import { geminiNanoService } from "@/service-worker/geminiNano/geminiNanoService";
import { MangleSchema } from "@/types/MangleSchema";

export function usePrompt() {
    async function prompt(
        inputText: string,
        mangleSchema: MangleSchema
    ): Promise<string | MangleSchemaProperties> {
        const { systemPrompt, schema } = createMangleDataPrompt(mangleSchema);

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
