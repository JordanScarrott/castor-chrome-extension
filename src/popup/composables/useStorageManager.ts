import { useChromeStorage } from "./useChromeStorage";
import { useStorage } from "@vueuse/core";
import { getNamespacedKey as getKey } from "../../utils/storageUtils";

/**
 * A Vue composable that provides namespaced storage utilities.
 * It creates reactive refs that are synced with either localStorage or chrome.storage.local,
 * but with keys that are automatically prefixed with a given tab group ID.
 *
 * @param tabGroupId The ID of the tab group to namespace the storage for.
 */
export function useStorageManager(tabGroupId: number | string) {
    const getNamespacedKey = (key: string) => getKey(key, tabGroupId);

    /**
     * Creates a reactive ref synced with localStorage, namespaced by the tab group ID.
     * @param key The storage key.
     * @param defaultValue The default value to use if the key is not found.
     */
    const useTabGroupStorage = <T>(key: string, defaultValue: T) => {
        return useStorage(getNamespacedKey(key), defaultValue);
    };

    /**
     * Creates a reactive ref synced with chrome.storage.local, namespaced by the tab group ID.
     * @param key The storage key.
     * @param defaultValue The default value to use if the key is not found.
     */
    const useTabGroupChromeStorage = <T>(key: string, defaultValue: T) => {
        return useChromeStorage(getNamespacedKey(key), defaultValue);
    };

    return {
        useTabGroupStorage,
        useTabGroupChromeStorage,
    };
}
