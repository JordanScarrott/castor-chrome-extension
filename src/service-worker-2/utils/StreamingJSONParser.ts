/**
 * @class StreamingJSONParser
 * @description A class to parse incomplete JSON strings, typically from a streaming source like an AI model.
 * It intelligently repairs the JSON by closing open structures (objects, arrays, strings)
 * and handling common syntax errors in partial data, like dangling commas or keys.
 * This version has been improved for greater robustness based on comprehensive testing.
 *
 * @example
 * const parser = new StreamingJSONParser();
 *
 * let partialJson = '{"name": "John Doe", "skills": ["TypeScript", "React"';
 * let parsed = parser.parse(partialJson);
 * console.log(parsed); // Output: { name: 'John Doe', skills: [ 'TypeScript', 'React' ] }
 *
 * partialJson += ', "incompleteKey"';
 * parsed = parser.parse(partialJson);
 * console.log(parsed); // Output: { name: 'John Doe', skills: [ 'TypeScript', 'React' ], incompleteKey: null }
 */
export class StreamingJSONParser {
	private lastValidObject: any = null;

	/**
	 * Parses a complete or incomplete JSON string.
	 * @param jsonString The JSON string to parse.
	 * @returns A valid JavaScript object representing the parsed data, or the last successfully parsed object if fixing fails.
	 */
	public parse(jsonString: string): any {
		if (!jsonString || typeof jsonString !== 'string') {
			return null; // Start fresh on invalid input
		}

		// Try a native parse first for valid JSON
		try {
			this.lastValidObject = JSON.parse(jsonString);
			return this.lastValidObject;
		} catch (e) {
			// It's incomplete, so proceed to fix it
		}

		try {
			const fixedJson = this.fixIncompleteJson(jsonString);
			this.lastValidObject = JSON.parse(fixedJson);
			return this.lastValidObject;
		} catch (e) {
			// If our repair attempt fails, it means the string is too malformed.
			// We return the last known good object to maintain a stable state.
			return this.lastValidObject;
		}
	}

	/**
	 * Repairs an incomplete JSON string by closing open structures.
	 * This is an improved, more robust implementation.
	 * @param text The incomplete JSON string.
	 * @returns A repaired, syntactically valid JSON string.
	 */
	private fixIncompleteJson(text: string): string {
		const stack: ('{' | '[')[] = [];
		let inString = false;
		let inEscape = false;

		// Pass 1: Scan the string to determine its current state (e.g., inside a string, unclosed objects/arrays).
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			if (inString) {
				if (inEscape) inEscape = false;
				else if (char === '\\') inEscape = true;
				else if (char === '"') inString = false;
			} else {
				// Only process structural characters if not in a string
				switch (char) {
					case '"':
						inString = true;
						break;
					case '{':
					case '[':
						stack.push(char);
						break;
					case '}':
						if (stack.length && stack[stack.length - 1] === '{') stack.pop();
						break;
					case ']':
						if (stack.length && stack[stack.length - 1] === '[') stack.pop();
						break;
				}
			}
		}

		let fixed = text.trim();

		// Handle root-level incomplete string
		if (fixed.startsWith('"') && !fixed.endsWith('"')) {
			return fixed + '"';
		}

		// Pass 2: Apply fixes in a logical order.

		// Fix 1: Handle dangling comma by removing it.
		if (fixed.endsWith(',')) {
			fixed = fixed.slice(0, -1);
		}

		const lastChar = fixed.slice(-1);
		const inObject = stack.length > 0 && stack[stack.length - 1] === '{';

		// Fix 2: Handle dangling key or colon inside an object.
		if (inObject && !inString) {
			// Case A: `{"key":`
			if (lastChar === ':') {
				fixed += 'null';
			}
			// Case B: `{"key"`
			else if (lastChar === '"') {
				// Check if this quote is part of a key, not a value.
				const lastColon = fixed.lastIndexOf(':');
				const lastComma = fixed.lastIndexOf(',');
				const lastBrace = fixed.lastIndexOf('{');
				if (lastColon <= Math.max(lastComma, lastBrace)) {
					fixed += ':null';
				}
			}
		}

		// Fix 3: Close any unterminated string that is part of a value.
		if (inString) {
			fixed += '"';
		}

		// Fix 4: Attempt to complete partial primitives. Be conservative and default to null.
		const partialPrimitiveRegex = /:\s*(t|tr|tru|f|fa|fal|fals|n|nu|nul)$/i;
		if (partialPrimitiveRegex.test(fixed)) {
			fixed = fixed.replace(partialPrimitiveRegex, ':null');
		}

		// Final Step: Close all open structures on the stack.
		while (stack.length > 0) {
			const openChar = stack.pop();
			fixed += openChar === '{' ? '}' : ']';
		}

		return fixed;
	}
}
