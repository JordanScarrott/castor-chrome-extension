import { createMangleSchemaPrompt } from "@/service-worker-2/geminiNano/prompts/gprompt";
import { geminiNanoService } from "@/modules/geminiNano/service/geminiNanoService";
import {
    manglePrompt,
    MangleSchemaProperties,
} from "@/service-worker/geminiNano/utils/prompts/prompts";
import { MangleSchema } from "@/types/MangleSchema";
import {
    createMangleRuleQueryPrompts,
    fact_schema_in_context_learning,
    mangle_systemPrompt,
} from "@/service-worker-2/geminiNano/prompts/autoGeneration/prompts";
import { PredicateDiscoverySchema } from "@/service-worker-2/mangle/PredicateDiscoverySchema";
import { MangleQueryBuilder } from "@/service-worker-2/mangle/MangleQueryBuilder";
import { ManglePromptSchema } from "@/service-worker-2/mangle/ManglePromptSchema";
import { MangleGenerationSchema } from "@/service-worker-2/mangle/MangleProgramTypeJSON";
import { MangleProgramType } from "@/service-worker-2/mangle/MangleSchema";
import { MangleFactCompiler } from "@/service-worker-2/mangle/factCompilation/MangleFactCompiler";

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

        // Attempt at automatic schema, rule, and query generation
        // await generateMangleSchemaGeneric(userGoal);

        const prompt = createMangleSchemaPrompt(userGoal);
        const response = (await geminiNanoService.askPrompt<MangleSchema>(
            "",
            prompt,
            schema
        )) as MangleSchema;

        console.log("🚀 ~ generateMangleSchema ~ response:", response);
        return response;
    }

    return { prompt, generateMangleSchema };
}

/**
 * Uses a generic mangle intermediate representation (IR) input schema for formatting the
 */
async function generateMangleSchemaGeneric(userGoal: string): Promise<void> {
    const facts = await geminiNanoService.askPrompt<
        typeof PredicateDiscoverySchema
    >(
        `USER GOAL:\n${userGoal}`,
        fact_schema_in_context_learning,
        PredicateDiscoverySchema
    );
    console.log("🚀 ~ generateMangleSchemaGeneric ~ facts:", facts);
    const mangleFactCompiler = new MangleFactCompiler();
    // mangleFactCompiler.compile(facts);
    console.log(
        "🚀 ~ generateMangleSchemaGeneric ~ mangleFactCompiler.compile(facts):",
        mangleFactCompiler.compile(facts)
    );

    const { systemPrompt, userPrompt } = createMangleRuleQueryPrompts(
        JSON.stringify(facts),
        userGoal
    );
    const rulesAndQueries = await geminiNanoService.askPrompt<
        typeof MangleGenerationSchema
    >(userPrompt, systemPrompt, MangleGenerationSchema);
    console.log(
        "🚀 ~ generateMangleSchemaGeneric ~ rulesAndQueries:",
        rulesAndQueries
    );

    if (typeof rulesAndQueries == "string") {
        throw "Type error - generated rules and queries are incorrect type.";
    }

    const mangleQueryBuilder = new MangleQueryBuilder(
        rulesAndQueries as unknown as MangleProgramType
    );

    (rulesAndQueries as unknown as MangleProgramType).queries.forEach((q) => {
        const name = (
            rulesAndQueries as unknown as MangleProgramType
        ).queries.at(0)?.name;

        if (name) {
            const queries = mangleQueryBuilder.build(name);
            console.log("🚀 ~ generateMangleSchemaGeneric ~ queries:", queries);
        }
    });
}
