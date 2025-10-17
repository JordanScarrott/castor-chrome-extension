import type { Ref } from "vue";
import { onUnmounted, ref, toRaw, watch } from "vue";

/**
 * Creates a reactive ref that is two-way synced with a specific key in chrome.storage.local.
 *
 * - When the component mounts, it fetches the initial value from storage.
 * - When the ref's value is changed in the component, it is automatically saved back to storage.
 * - When the value in storage changes (e.g., from a service worker), the ref is updated.
 *
 * This composable handles the entire lifecycle, including cleaning up listeners to prevent memory leaks.
 *
 * @param key The key in chrome.storage.local to sync with.
 * @param defaultValue The default value to use if the key is not found in storage.
 * @returns A Vue Ref<T> that is reactively synced with the storage value.
 */
export function useChromeStorage<T>(key: string, defaultValue: T): Ref<T> {
    const storedValue = ref(defaultValue) as Ref<T>;

    // Asynchronously fetch the initial value from storage.
    chrome.storage.local.get(key, (result) => {
        if (result[key] !== undefined) {
            storedValue.value = result[key];
        }
    });

    // Define the listener to react to external storage changes.
    const storageListener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
    ) => {
        if (areaName === "local" && changes[key]) {
            const newValue = changes[key].newValue;

            // Use JSON string comparison for a simple deep-equals check.
            // This prevents a feedback loop when the change was initiated by our own `watch` effect,
            // which is crucial when working with objects or arrays.
            if (
                JSON.stringify(storedValue.value) !== JSON.stringify(newValue)
            ) {
                storedValue.value = newValue;
            }
        }
    };

    // Add the listener for external changes.
    chrome.storage.onChanged.addListener(storageListener);

    // Clean up the listener when the component is unmounted.
    onUnmounted(() => {
        chrome.storage.onChanged.removeListener(storageListener);
    });

    // Watch for local changes to the ref and sync them back to storage.
    watch(
        storedValue,
        (newValue) => {
            chrome.storage.local.set({ [key]: toRaw(newValue) });
        },
        { deep: true } // Use `deep` watch to detect changes within objects and arrays.
    );

    return storedValue;
}
