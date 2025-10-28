import {
    PredicateDefinition,
    PredicateDiscoveryIR,
} from "@/service-worker-2/mangle/factCompilation/PredicateDiscoveryIR";

/**
 * Compiles a PredicateDiscoveryIR object into a deterministic,
 * sorted list of "mangled" fact strings.
 *
 * "Mangled" facts are represented as predicate signatures in the format:
 * `predicate_name(Arg1, Arg2, ...ArgN)`
 *
 * This format is derived from the query syntax (e.g., `product(Name, Price)`)
 * seen in the provided test files.
 */
export class MangleFactCompiler {
    /**
     * Compiles the IR into a list of mangled fact strings (predicate signatures).
     * The list is sorted alphabetically by predicate name to ensure determinism.
     *
     * @param ir The PredicateDiscoveryIR object.
     * @returns A sorted array of mangled fact strings.
     */
    public compile(ir: PredicateDiscoveryIR): string[] {
        // Return early if the schema is missing or empty
        if (!ir?.baseFactSchema || ir.baseFactSchema.length === 0) {
            return [];
        }

        // Create a copy and sort the predicates alphabetically by name.
        // This is the key step to ensure the output is deterministic.
        const sortedPredicates = [...ir.baseFactSchema].sort((a, b) =>
            a.predicateName.localeCompare(b.predicateName)
        );

        // Map the sorted predicate objects to their string representation.
        return sortedPredicates.map((predicate) =>
            this.formatPredicate(predicate)
        );
    }

    /**
     * Converts a snake_case string to PascalCase.
     * @example "hotel_id" -> "HotelId"
     * @example "bus_stop_id" -> "BusStopId"
     * @example "location" -> "Location"
     * @param snake The snake_case input string.
     * @returns The PascalCase output string.
     */
    private snakeToPascal(snake: string): string {
        if (!snake) {
            return "";
        }
        // Split by underscore, capitalize first letter of each part, and join
        return snake
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");
    }

    /**
     * Formats a single PredicateDefinition into a mangled predicate signature string.
     * Arguments are converted from snake_case (from the IR) to PascalCase
     * to match the query variable conventions seen in the test files.
     *
     * @param predicate The predicate definition to format.
     * @returns A string in the format `predicate_name(Arg1, Arg2)`.
     */
    private formatPredicate(predicate: PredicateDefinition): string {
        // Convert snake_case arguments from IR to PascalCase variables
        const pascalCaseArgs = predicate.arguments.map(this.snakeToPascal);

        // Join arguments, preserving the order given in the IR
        const joinedArgs = pascalCaseArgs.join(", ");

        // Format the final string
        return `${predicate.predicateName}(${joinedArgs})`;
    }
}
