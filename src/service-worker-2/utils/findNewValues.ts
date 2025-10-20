import { merge } from "es-toolkit";

/**
 * Recursively finds new values in a JSON object or array by comparing it to an old version.
 * @param newNode The new JSON object or array.
 * @param oldNode The old JSON object or array to compare against.
 * @returns An array of newly discovered values (strings, numbers, or simple objects).
 */
export function findNewValues(newNode: any, oldNode: any): any[] {
    if (oldNode === null || oldNode === undefined) {
        if (typeof newNode === "object" && newNode !== null) {
            return Object.values(newNode);
        }
        return [newNode];
    }

    if (Array.isArray(newNode) && Array.isArray(oldNode)) {
        const oldSet = new Set(oldNode.map((item) => JSON.stringify(item)));
        return newNode
            .filter((item) => !oldSet.has(JSON.stringify(item)))
            .map((item) => {
                // If the item is an object, we might want to announce the whole object as new
                // For this implementation, we'll just return the object itself.
                return item;
            });
    }

    if (
        typeof newNode === "object" &&
        newNode !== null &&
        typeof oldNode === "object" &&
        oldNode !== null &&
        !Array.isArray(newNode) &&
        !Array.isArray(oldNode)
    ) {
        const newValues: any[] = [];
        for (const key in newNode) {
            if (Object.prototype.hasOwnProperty.call(newNode, key)) {
                if (!Object.prototype.hasOwnProperty.call(oldNode, key)) {
                    newValues.push(newNode[key]);
                } else {
                    const nestedNewValues = findNewValues(
                        newNode[key],
                        oldNode[key]
                    );
                    newValues.push(...nestedNewValues);
                }
            }
        }
        return newValues;
    }

    return [];
}
