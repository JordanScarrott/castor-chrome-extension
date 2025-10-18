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
        const title = await geminiNanoService.askPrompt(
            goalText,
            `
You are an expert at creating concise, helpful Chrome tab group names. Given a user's goal, generate a short name, 3 words or less.
GOAL: "I'm planning a trip to Japan for next spring to see the cherry blossoms."
NAME: Japan Trip
GOAL: "I'm working on the Q4 marketing report and looking at competitor data."
NAME: Q4 Marketing
GOAL: "I trying to find a budget-friendly laptop with a long battery life."
NAME: Budget Laptop
GOAL: "I'm learning how to use the Gemini API with Python."
NAME: Gemini API
GOAL: "{{USER_GOAL}}"
NAME:
`
        );

        return title;
    } catch (error) {
        console.error("Error generating tab group title with Nano:", error);
        // Fallback to the simple title generation
        return generateTabGroupTitle(goalText);
    }
}
