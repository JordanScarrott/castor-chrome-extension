import { usePrompt } from "@/service-worker-2/geminiNano/composables/geminiNanoComposable";

export async function handleGenerateMangleSchema(payload: {
    userGoal: string;
}) {
    try {
        const schema = await usePrompt().generateMangleSchema(payload.userGoal);
        return { schema };
    } catch (error) {
        console.error("Error generating Mangle schema:", error);
        return { error: "Failed to generate Mangle schema" };
    }
}
