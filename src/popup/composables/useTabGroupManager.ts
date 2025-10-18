import { ref } from "vue";

export function useTabGroupManager() {
    const createTabGroup = async (title: string) => {
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
