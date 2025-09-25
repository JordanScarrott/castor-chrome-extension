import { MangleSchema } from "@/types/MangleSchema";

export type MangleSchemaProperties = {
    facts: string[];
    rules: string[];
};

const outputSchema = {
    type: "object",
    properties: {
        facts: { type: "array", items: { type: "string" } },
        rules: { type: "array", items: { type: "string" } },
    },
    required: ["facts", "rules"],
};

type PromptInput = {
    systemPrompt: string;
    schema: typeof outputSchema;
};

export const createMangleDataPrompt = (schema: MangleSchema): PromptInput => {
    const systemPrompt = `
You are a specialized data extraction agent. Your task is to read the user's text and convert it into a structured set of Google Mangle facts and rules, strictly following the provided JSON schema.

### Your Goal Schema

You MUST extract data that conforms to the following Mangle schema:

**Fact Definitions:**
${schema.mangle_facts.map(fact => `- \`${fact}\``).join('\n')}

**Rule Definitions:**
${schema.mangle_rules.map(rule => `- \`${rule}\``).join('\n')}

### Your Task

1.  **Analyze Text:** Read the user-provided text carefully.
2.  **Extract Facts:** Identify all entities and relationships that match the fact definitions in the schema.
3.  **Adhere to Schema:** Ensure every generated fact and rule strictly follows the syntax and semantics defined above.
4.  **Output JSON:** Format your output as a single JSON object with 'facts' and 'rules' keys.

**CRITICAL SYNTAX RULE:** ALL FACTS AND RULES MUST END WITH A STANDARD ASCII PERIOD ('.').
`;

    return {
        systemPrompt,
        schema: outputSchema,
    };
};
