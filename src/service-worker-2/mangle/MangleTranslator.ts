/**
 * A utility class to translate an arbitrary JSON object into a flat array
 * of atomic, interconnected Mangle fact strings.
 *
 * @class MangleTranslator
 */
export class MangleTranslator {
    /**
     * A list of common keys used to identify a primary ID within a JSON object.
     * @private
     * @static
     * @readonly
     */
    private static readonly ID_KEYS: string[] = [
        "sku",
        "id",
        "_id",
        "product_id",
        "order_id",
    ];

    /**
     * The collection of Mangle facts generated during a translation.
     * @private
     */
    private facts: string[] = [];

    /**
     * Translates a JSON object into an array of Mangle fact strings.
     *
     * @public
     * @param {any} jsonData The input JSON object.
     * @param {string} [rootPredicate='entity'] A root name for the primary entity.
     * @returns {string[]} An array of Mangle fact strings.
     */
    public translate(
        jsonData: any,
        rootPredicate: string = "entity"
    ): string[] {
        // Reset state for a fresh translation run
        this.facts = [];

        if (typeof jsonData !== "object" || jsonData === null) {
            console.error("Invalid input: jsonData must be a non-null object.");
            return [];
        }

        const { id, key: primaryIdKey } = this.findPrimaryId(
            jsonData,
            rootPredicate
        );
        this.traverse(jsonData, id, rootPredicate, primaryIdKey);

        return this.facts;
    }

    /**
     * Recursively traverses the JSON object to generate Mangle facts.
     * It delegates the processing of values to specialized methods.
     *
     * @private
     * @param {any} currentObject The object currently being processed.
     * @param {string} parentId The Mangle ID of the parent entity.
     * @param {string} predicatePrefix The current prefix for predicate names.
     * @param {string | null} primaryIdKey The key used for the root ID, to avoid duplication.
     */
    private traverse(
        currentObject: any,
        parentId: string,
        predicatePrefix: string,
        primaryIdKey: string | null
    ): void {
        for (const [key, value] of Object.entries(currentObject)) {
            // Skip the key that was used to generate the ID to avoid redundant facts.
            if (key === primaryIdKey) {
                continue;
            }

            if (Array.isArray(value)) {
                this.processArray(value, parentId, predicatePrefix, key);
            } else if (typeof value === "object" && value !== null) {
                this.processObject(value, parentId, predicatePrefix, key);
            } else {
                this.processPrimitive(value, parentId, predicatePrefix, key);
            }
        }
    }

    /**
     * Processes an array value, creating facts for primitives or new intermediate entities for objects.
     *
     * @private
     */
    private processArray(
        arr: any[],
        parentId: string,
        predicatePrefix: string,
        key: string
    ): void {
        // Improved singularization logic for array keys.
        let singularPredicate = key;
        if (key.endsWith("ies")) {
            singularPredicate = key.slice(0, -3) + "y";
        } else if (key.endsWith("s")) {
            singularPredicate = key.slice(0, -1);
        }

        const fullPredicateName = `${predicatePrefix}_${singularPredicate}`;

        arr.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
                // Create a new intermediate entity for the object in the array
                const childId = `${parentId}/${singularPredicate}/${index}`;
                this.facts.push(
                    `${fullPredicateName}(${this.formatValue(
                        childId
                    )}, ${this.formatValue(parentId)}).`
                );
                this.traverse(item, childId, fullPredicateName, null); // primaryIdKey is null for children
            } else {
                // The item is a primitive, link it directly to the parent
                const formattedItem = this.formatValue(item, key);
                if (formattedItem !== null) {
                    this.facts.push(
                        `${fullPredicateName}(${this.formatValue(
                            parentId
                        )}, ${formattedItem}).`
                    );
                }
            }
        });
    }

    /**
     * Processes a nested object value by continuing the recursive traversal.
     *
     * @private
     */
    private processObject(
        obj: any,
        parentId: string,
        predicatePrefix: string,
        key: string
    ): void {
        const newPredicatePrefix = `${predicatePrefix}_${key}`;
        this.traverse(obj, parentId, newPredicatePrefix, null); // primaryIdKey is null for children
    }

    /**
     * Processes a primitive leaf value (string, number, boolean) by creating a single fact.
     *
     * @private
     */
    private processPrimitive(
        value: any,
        parentId: string,
        predicatePrefix: string,
        key: string
    ): void {
        const predicateName = `${predicatePrefix}_${key}`;
        const formattedValue = this.formatValue(value, key);
        if (formattedValue !== null) {
            this.facts.push(
                `${predicateName}(${this.formatValue(
                    parentId
                )}, ${formattedValue}).`
            );
        }
    }

    /**
     * Finds or generates the primary Mangle ID for a given object.
     *
     * @private
     * @param {any} obj The object to find the ID for.
     * @param {string} prefix The prefix for the ID.
     * @returns {{id: string, key: string | null}} The primary Mangle ID and the key used to generate it.
     */
    private findPrimaryId(
        obj: any,
        prefix: string
    ): { id: string; key: string | null } {
        for (const key of MangleTranslator.ID_KEYS) {
            if (obj[key]) {
                return { id: `/${prefix}/${obj[key]}`, key: key };
            }
        }
        return { id: `/${prefix}/${crypto.randomUUID()}`, key: null };
    }

    /**
     * Formats a JavaScript value into a Mangle-compatible literal string.
     *
     * @private
     * @param {*} value The value to format.
     * @param {string|null} [key=null] The JSON key of the value, used for contextual formatting.
     * @returns {string | null} The Mangle-formatted literal or null if not a supported type.
     */
    private formatValue(value: any, key: string | null = null): string | null {
        if (typeof value === "string") {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        if (typeof value === "number") {
            // FIX: Handle cases like 'price' where a trailing .0 is desired for integer values.
            if (key === "price" && Number.isInteger(value)) {
                return value.toFixed(1);
            }
            return String(value);
        }
        if (typeof value === "boolean") {
            return String(value);
        }
        return null;
    }
}
