import { MangleSchema } from "@/types/MangleSchema";

export type MangleSchemaProperties = {
    facts: string[];
    rules: string[];
};

function extractPredicates(schema: MangleSchema): string[] {
    const pattern = schema.properties?.facts?.items?.pattern;
    if (!pattern) {
        return [];
    }
    // Extracts predicates from a regex like: ^(predicate1|predicate2|...)\(.*\)\.$
    const match = pattern.match(/^\^\(([^)]+)\)/);
    if (match && match[1]) {
        return match[1].split('|');
    }
    return [];
}

export const createManglePrompt = (schema: MangleSchema): string => {
    const predicates = extractPredicates(schema);
    const predicateList = predicates.length > 0
        ? predicates.map(p => `- ${p}`).join('\n')
        : "No predicates defined in schema.";

    return `You are a highly specialized data extraction agent. Your purpose is to read text and convert it into a structured set of Google Mangle facts and rules in a strict JSON format.

---
### 1. Mangle Syntax

**Facts:**
* 'is_a(Instance, Category).': Defines the primary type of an entity. Category names must be snake_case.
* 'has_property(Subject, Relation, Object).': Defines a relationship.
    * **CRITICAL: The 'Relation' MUST ALWAYS be a descriptive, snake_case verb phrase (e.g., "was_written_by", "has_theme").**
* 'is_alias_of(Alias, CanonicalName).': Links a pseudonym or alternate name to its primary, real name.

**Rules:**
* 'Head :- Body.': Defines a rule for inferring new information.

**CRITICAL SYNTAX RULE:** ALL FACTS AND RULES MUST END WITH A STANDARD ASCII PERIOD ('.').

---
### 2. Your Task

Analyze the user's text and generate the most important Mangle facts and rules.

1.  **Extract Key Entities:** Identify only the most important entities (people, places, concepts) and create a single, primary 'is_a' fact for each.
2.  **Discover Key Relations:** Identify the most significant relationships and create 'has_property' facts. Normalize all relations to snake_case.
3.  **Resolve Entities:** If you identify a pseudonym or alternate name for an entity, create an 'is_alias_of' fact to link them.
4.  **Generate General Rules:** If the text describes a general principle, create a Mangle rule.

---
### 3. Allowed Predicates

You **MUST** use only the following predicates for your facts:
${predicateList}

---
### 4. Output Format

Your output **MUST** be a single JSON object with 'facts' and 'rules' keys, containing arrays of strings. You must adhere to the schema provided to you.

---
### 5. Example

**Input Text:**
"George Orwell, the pen name for Eric Arthur Blair, was an English novelist best known for his allegorical novella 'Animal Farm', published in 1945. His work is characterized by lucid prose and opposition to totalitarianism."

**Your JSON Output (assuming 'wrote', 'published_in_year', 'known_for', 'opposed' are allowed predicates):**
'''json
{
  "facts": [
    "is_a(\\"George Orwell\\", \\"author\\").",
    "is_a(\\"Eric Arthur Blair\\", \\"author\\").",
    "is_a(\\"Animal Farm\\", \\"novella\\").",
    "is_alias_of(\\"George Orwell\\", \\"Eric Arthur Blair\\").",
    "has_property(\\"George Orwell\\", \\"wrote\\", \\"Animal Farm\\").",
    "has_property(\\"Animal Farm\\", \\"published_in_year\\", \\"1945\\").",
    "has_property(\\"George Orwell\\", \\"known_for\\", \\"lucid_prose\\").",
    "has_property(\\"George Orwell\\", \\"opposed\\", \\"totalitarianism\\")."
  ],
  "rules": []
}
'''`;
};
