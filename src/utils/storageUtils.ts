/**
 * Generates a namespaced storage key.
 * @param key The base key.
 * @param tabGroupId The ID of the tab group to namespace the key for.
 * @returns The namespaced key in the format `${tabGroupId}_${key}`.
 */
export function getNamespacedKey(
    key: string,
    tabGroupId: number | string
): string {
    return `${tabGroupId}_${key}`;
}
