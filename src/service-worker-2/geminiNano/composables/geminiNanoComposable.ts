import { createMangleSchemaPrompt } from "@/core/gprompt";
import { geminiNanoService } from "@/modules/geminiNano/service/geminiNanoService";
import {
    manglePrompt,
    MangleSchemaProperties,
} from "@/service-worker/geminiNano/utils/prompts/prompts";
import { MangleSchema } from "@/types/MangleSchema";

export function usePrompt() {
    async function prompt(
        inputText: string
    ): Promise<string | MangleSchemaProperties> {
        const { systemPrompt, schema } = manglePrompt();

        // Assuming 'articleText' contains the text from Readability.js
        const result =
            await geminiNanoService.askPrompt<MangleSchemaProperties>(
                inputText,
                systemPrompt,
                schema
            );

        return result;
    }

    async function generateMangleSchema(
        userGoal: string
    ): Promise<MangleSchema> {
        const schema: MangleSchema = {
            guiding_questions: [],
            mangle_facts: [],
            mangle_rules: [],
        };

        const prompt = createMangleSchemaPrompt(userGoal);
        const response = (await geminiNanoService.askPrompt<MangleSchema>(
            "",
            prompt,
            schema
        )) as MangleSchema;

        return response;
    }

    return { prompt, generateMangleSchema };
}
