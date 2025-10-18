/**
 * Generates a short title for a Chrome tab group from a longer string.
 * It takes the first 3 words of the input string.
 *
 * @param goalText The full text of the user's goal.
 * @returns A shortened string suitable for a tab group title.
 */
import { geminiNanoService } from "../service-worker-2/geminiNano/geminiNanoService";

export function generateTabGroupTitle(goalText: string): string {
    return goalText.split(" ").slice(0, 3).join(" ");
}

/**
 * Generates a short title for a Chrome tab group using the Gemini Nano service.
 *
 * @param goalText The full text of the user's goal.
 * @returns A promise that resolves with a shortened string suitable for a tab group title.
 */
export async function generateTabGroupTitleWithNano(
    goalText: string
): Promise<string> {
    try {
        // Option 1: Use the summarize call
        const title = await geminiNanoService.summarize(goalText);

        // Option 2: Use the prompt call with a system prompt
        // const title = await geminiNanoService.askPrompt(goalText, "Summarize the following into a very short title for a browser tab group.");

        return title;
    } catch (error) {
        console.error("Error generating tab group title with Nano:", error);
        // Fallback to the simple title generation
        return generateTabGroupTitle(goalText);
    }
}
