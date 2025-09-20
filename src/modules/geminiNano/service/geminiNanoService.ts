class GeminiNanoService {
    constructor() {
        // Reserved for future config
    }

    async summarize(inputText: string): Promise<string> {
        // Feature detect
        if (typeof Summarizer === "undefined") {
            console.warn("Summarizer API not supported in this browser.");
            return "";
        }

        const options: SummarizeOptions = {
            sharedContext: "This is a scientific article",
            type: "key-points",
            format: "markdown",
            length: "medium",
            monitor(m) {
                m.addEventListener("downloadprogress", (e: any) => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            },
        };

        const availability = await Summarizer.availability();
        if (availability === "unavailable") {
            console.warn("Summarizer API is unavailable.");
            return "";
        }

        if (!navigator.userActivation.isActive) {
            console.warn("User interaction required before summarization.");
            return "";
        }

        const summarizer = await Summarizer.create(options);
        return await summarizer.summarize(inputText, {
            context: "This article is intended for a tech-savvy audience.",
        });
    }

    /**
     * Uses Chrome's Prompt API to ask a question using the LanguageModel.
     * @param userPrompt The user's question or prompt.
     * @param systemPrompt Optional system-level context (e.g. "You are a helpful assistant")
     * @param schema Optional JSON Schema to constrain the output.
     * @param abortSignal Optional AbortSignal to cancel the request.
     * @returns The result string or JSON-parsed object (if schema given).
     */
    async askPrompt<T = string>(
        userPrompt: string,
        systemPrompt?: string,
        schema?: object,
        abortSignal?: AbortSignal
    ): Promise<T | string> {
        // Feature detect
        if (typeof LanguageModel === "undefined") {
            console.warn("Prompt API not supported in this browser.");
            return "" as string;
        }

        // Check availability
        const availability = await LanguageModel.availability();
        if (availability === "unavailable") {
            console.warn("Prompt API is unavailable.");
            return "" as string;
        }

        // Optionally monitor download, if model not yet ready
        const session = await LanguageModel.create({
            signal: abortSignal,
            monitor: (m: any) => {
                m.addEventListener("downloadprogress", (e: any) => {
                    console.log(
                        `LanguageModel downloaded ${Math.floor(
                            e.loaded * 100
                        )}%`
                    );
                });
            },
            initialPrompts: systemPrompt
                ? [
                      {
                          role: "system",
                          content: systemPrompt,
                      },
                  ]
                : undefined,
        });

        try {
            let result: string;

            if (schema) {
                // Constrain the output with JSON Schema
                result = await session.prompt(userPrompt, {
                    responseConstraint: schema,
                    signal: abortSignal,
                });
                // Try parsing
                try {
                    const parsed = JSON.parse(result);
                    return parsed as T;
                } catch (err) {
                    console.warn(
                        "Response did not match schema / JSON parse failed",
                        err
                    );
                    // Fallback: return the raw string
                    return result;
                }
            } else {
                // No schema: just prompt and return string
                result = await session.prompt(userPrompt, {
                    signal: abortSignal,
                });
                return result;
            }
        } finally {
            // Clean up
            await session.destroy();
        }
    }

    /**
     * Uses Chrome's Prompt API to ask a question using the LanguageModel and streams the response.
     * @param userPrompt The user's question or prompt.
     * @param systemPrompt Optional system-level context (e.g. "You are a helpful assistant")
     * @param onChunk Callback function to handle each chunk of the response.
     * @param abortSignal Optional AbortSignal to cancel the request.
     */
    async askPromptStreaming(
        userPrompt: string,
        systemPrompt: string | undefined,
        onChunk: (chunk: string) => void,
        abortSignal?: AbortSignal
    ): Promise<void> {
        // Feature detect
        if (typeof LanguageModel === "undefined") {
            console.warn("Prompt API not supported in this browser.");
            return;
        }

        // Check availability
        const availability = await LanguageModel.availability();
        if (availability === "unavailable") {
            console.warn("Prompt API is unavailable.");
            return;
        }

        const session = await LanguageModel.create({
            signal: abortSignal,
            initialPrompts: systemPrompt
                ? [
                      {
                          role: "system",
                          content: systemPrompt,
                      },
                  ]
                : undefined,
        });

        try {
            // Get a streaming response
            const stream = await session.promptStreaming(userPrompt, {
                signal: abortSignal,
            });

            // Read from the stream and call the callback for each chunk
            for await (const chunk of stream) {
                onChunk(chunk);
            }
        } finally {
            // Clean up
            await session.destroy();
        }
    }

    /**
     * Uses Chrome's Summarizer API to summarize text and streams the response.
     * @param inputText The text to summarize.
     * @param onChunk Callback function to handle each chunk of the response.
     */
    async summarizeStreaming(
        inputText: string,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        // Feature detect
        if (typeof Summarizer === "undefined") {
            console.warn("Summarizer API not supported in this browser.");
            return;
        }

        const availability = await Summarizer.availability();
        if (availability === "unavailable") {
            console.warn("Summarizer API is unavailable.");
            return;
        }

        if (!navigator.userActivation.isActive) {
            console.warn("User interaction required before summarization.");
            return;
        }

        const summarizer = await Summarizer.create();
        const stream = await summarizer.summarizeStreaming(inputText);

        for await (const chunk of stream) {
            onChunk(chunk);
        }
    }
}

export const geminiNanoService = new GeminiNanoService();
