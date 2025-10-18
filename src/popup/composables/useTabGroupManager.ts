import { ref } from "vue";

const getRandomColor = (): chrome.tabGroups.Color => {
    const colorValues = Object.values(chrome.tabGroups.Color);
    const randomIndex = Math.floor(Math.random() * colorValues.length);
    return colorValues[randomIndex];
};

/**
 * A Vue composable for managing Chrome tab groups.
 * Provides functions to create and update tab groups.
 */
export function useTabGroupManager() {
    /**
     * Creates a new Chrome tab group with the active tab and assigns it a title and color.
     *
     * @param title The title for the new tab group.
     * @returns A promise that resolves with the new group's ID, or null on error.
     */
    const createTabGroup = async (title: string): Promise<number | null> => {
        try {
            const [currentTab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            if (currentTab && currentTab.id) {
                const newGroupId = await chrome.tabs.group({
                    tabIds: currentTab.id,
                });

                console.log(`Created tab group with ID: ${newGroupId}`);
                console.log("Checking chrome.tabGroups API:", chrome.tabGroups);

                if (!chrome.tabGroups) {
                    console.error(
                        "chrome.tabGroups API is not available. This is likely a permissions issue. Ensure 'tabGroups' is in the manifest.json permissions."
                    );
                    return newGroupId; // Return the groupId even if we can't update it
                }

                await chrome.tabGroups.update(newGroupId, {
                    title,
                    color: getRandomColor(),
                });

                console.log(`Successfully updated tab group ${newGroupId}`);
                return newGroupId;
            }
            return null; // Explicitly return null if no tab was found
        } catch (error) {
            console.error("Error creating tab group:", error);
            return null;
        }
    };

    return {
        createTabGroup,
    };
}
