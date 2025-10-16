import {
    MangleProgramType,
    MangleRule,
    MangleClause,
    AtomClause,
    ComparisonClause,
    MangleTerm,
    MangleFinalQuery,
} from "@/service-worker-2/mangle/MangleSchema";

/**
 * Translates a structured Mangle IR object into a syntactically correct
 * Mangle Datalog query string for a specific, named query.
 */
export class MangleQueryBuilder {
    private readonly program: MangleProgramType;
    private readonly VARIABLE_PREFIX = "?";

    /**
     * Initializes the builder with the Mangle program IR.
     * @param program The `MangleProgramType` object containing the rules and queries.
     */
    constructor(program: MangleProgramType) {
        this.program = program;
    }

    /**
     * **Crucial Syntax Safety Function:** Formats a term for Mangle syntax.
     * If a term is a string starting with '?', it's a variable and the prefix is removed.
     * If it's any other string, it is wrapped in double quotes.
     * @param term The term to format.
     * @returns A string correctly formatted for the Mangle engine.
     */
    private _formatTerm(term: MangleTerm): string {
        if (typeof term === "string") {
            if (term.startsWith(this.VARIABLE_PREFIX)) {
                // It's a variable. Remove the prefix to get the final variable name.
                return term.slice(1);
            }
            // It's a string literal and MUST be quoted.
            return `"${term}"`;
        }
        // It's a number or boolean, which can be returned as is.
        return String(term);
    }

    /**
     * Builds the string for an AtomClause, e.g., `!predicate("arg1", Arg2)`.
     */
    private _buildAtom(clause: AtomClause): string {
        const args = clause.args.map((arg) => this._formatTerm(arg)).join(", ");
        const atomStr = `${clause.predicate}(${args})`;
        return clause.isNegated ? `!${atomStr}` : atomStr;
    }

    /**
     * Builds the string for a ComparisonClause, e.g., `Price <= 500`.
     */
    private _buildComparison(clause: ComparisonClause): string {
        // Variables in comparisons are not MangleTerms, so we handle them directly.
        const variableName = clause.variable.startsWith(this.VARIABLE_PREFIX)
            ? clause.variable.slice(1)
            : clause.variable;
        const formattedValue = this._formatTerm(clause.value);
        return `${variableName} ${clause.operator} ${formattedValue}`;
    }

    /**
     * Delegates a MangleClause to the appropriate formatting method.
     */
    private _buildClause(clause: MangleClause): string {
        switch (clause.type) {
            case "atom":
                return this._buildAtom(clause);
            case "comparison":
                return this._buildComparison(clause);
        }
    }

    /**
     * Builds a complete rule string, e.g., `head(X) :- body(X, "blue").`.
     */
    private _buildRule(rule: MangleRule): string {
        // Head arguments are also variables that need their prefixes removed.
        const headArgs = rule.head.args
            .map((arg) =>
                arg.startsWith(this.VARIABLE_PREFIX) ? arg.slice(1) : arg
            )
            .join(", ");
        const head = `${rule.head.predicate}(${headArgs})`;
        const body = rule.body
            .map((clause) => this._buildClause(clause))
            .join(", ");
        return `${head} :- ${body}.`;
    }

    /**
     * Builds the final query statement for a given query object.
     * e.g., `query predicate(X, Y).`
     */
    private _buildQuery(query: MangleFinalQuery): string {
        const whereClauses = query.where
            .map((clause) => this._buildAtom(clause))
            .join(", ");
        // Based on test files, the final query is just the clause, not prefixed with "query".
        return `${whereClauses}.`;
    }

    /**
     * Orchestrates the entire build process. It finds a specific query by name,
     * combines all defined rules with that single query, and returns the
     * complete, valid Mangle program string.
     *
     * @param queryName The unique name of the query to build from the program's `queries` array.
     * @returns The complete Mangle program string for the specified query.
     * @throws {Error} If a query with the given name is not found.
     */
    public build(queryName: string): string {
        const ruleStrings = this.program.rules
            .map((rule) => this._buildRule(rule))
            .join("\n\n");

        const targetQuery = this.program.queries.find(
            (q) => q.name === queryName
        );

        if (!targetQuery) {
            throw new Error(
                `Query with name "${queryName}" not found in Mangle program.`
            );
        }

        const finalQueryString = this._buildQuery(targetQuery);

        if (ruleStrings) {
            return `${ruleStrings}\n\n${finalQueryString}`;
        }

        return finalQueryString;
    }
}
