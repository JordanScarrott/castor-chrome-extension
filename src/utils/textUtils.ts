/**
 * Generates a short title for a Chrome tab group from a longer string.
 * It takes the first 3 words of the input string.
 *
 * @param goalText The full text of the user's goal.
 * @returns A shortened string suitable for a tab group title.
 */
export function generateTabGroupTitle(goalText: string): string {
    return goalText.split(" ").slice(0, 3).join(" ");
}
