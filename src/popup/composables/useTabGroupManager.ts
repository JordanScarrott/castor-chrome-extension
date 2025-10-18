import { ref } from "vue";

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
                await chrome.tabGroups.update(newGroupId, {
                    title,
                    color: "blue",
                });
                return newGroupId;
            }
        } catch (error) {
            console.error("Error creating tab group:", error);
            return null;
        }
    };

    return {
        createTabGroup,
    };
}
