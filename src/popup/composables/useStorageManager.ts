import { useChromeStorage } from "./useChromeStorage";
import { useStorage } from "@vueuse/core";

export function useStorageManager(tabGroupId: number | string) {
    const getNamespacedKey = (key: string) => `${tabGroupId}_${key}`;

    const useTabGroupStorage = <T>(key: string, defaultValue: T) => {
        return useStorage(getNamespacedKey(key), defaultValue);
    };

    const useTabGroupChromeStorage = <T>(key: string, defaultValue: T) => {
        return useChromeStorage(getNamespacedKey(key), defaultValue);
    };

    return {
        useTabGroupStorage,
        useTabGroupChromeStorage,
    };
}
