class GeminiNanoService {
    private sessionCache = new Map<string, any>();

    constructor() {
        // Reserved for future config
    }

    /**
     * Generates a consistent cache key from a session's configuration object.
     * This method handles object property order by sorting the keys before stringifying.
     * @param options The options object for creating the session.
     * @returns A stringified, sorted representation of the options.
     */
    private getCacheKey(options: object): string {
        if (!options) return 'default';
        const sortedOptions = Object.keys(options).sort().reduce(
            (acc, key) => {
                acc[key] = options[key];
                return acc;
            }, {} as { [key: string]: any }
        );
        return JSON.stringify(sortedOptions);
    }

    /**
     * Clears all cached sessions, destroying them to release resources.
     */
    async clearCache() {
        for (const session of this.sessionCache.values()) {
            if (session && typeof session.destroy === 'function') {
                await session.destroy();
            }
        }
        this.sessionCache.clear();
    }

    /**
     * Speeds up the initial response time of Gemini Nano.
     * TODO: Should be replaced by reusing session instances.
     *          - We can have this class or another act as a Gemini Nano factory that returns a session instance container and a method to prompt the model.
     */
    async primeGeminiNano(): Promise<void> {
        await this.primePromptAPI();
    }

    private async primePromptAPI(): Promise<void> {
        const session = await LanguageModel.create({
            signal: undefined,
            monitor: (m: any) => {
                m.addEventListener("downloadprogress", (e: any) => {
                    console.log(
                        `Prompt Model downloaded ${Math.floor(e.loaded * 100)}%`
                    );
                });
            },
        });
        await session.prompt("");
    }

    /**
     * Summarizes the given text using the Summarizer API with caching.
     * @param inputText The text to summarize.
     * @param options Options for the summarizer session.
     * @returns The summarized text.
     */
    async summarize(inputText: string, options: any = {}): Promise<string> {
        // Feature detect
        if (typeof Summarizer === "undefined") {
            console.warn("Summarizer API not supported in this browser.");
            return "";
        }

        const availability = await Summarizer.availability();
        if (availability === "unavailable") {
            console.warn("Summarizer API is unavailable.");
            return "";
        }

        const cacheKey = this.getCacheKey(options);
        let summarizer = this.sessionCache.get(cacheKey);

        if (!summarizer) {
            const createOptions = {
                ...options,
                monitor(m: any) {
                    m.addEventListener("downloadprogress", (e: any) => {
                        console.log(`Downloaded ${e.loaded * 100}%`);
                    });
                },
            };
            summarizer = await Summarizer.create(createOptions);
            this.sessionCache.set(cacheKey, summarizer);
        }

        return await summarizer.summarize(inputText, {
            context: "This article is intended for a tech-savvy audience.",
        });
    }

    /**
     * Uses Chrome's Prompt API to ask a question using the LanguageModel with caching.
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

        const options = {
            signal: abortSignal,
            initialPrompts: systemPrompt ? [{ role: "system", content: systemPrompt }] : undefined,
        };
        const cacheKey = this.getCacheKey(options);
        let session = this.sessionCache.get(cacheKey);

        if (!session) {
            session = await LanguageModel.create({
                ...options,
                monitor: (m: any) => {
                    m.addEventListener("downloadprogress", (e: any) => {
                        console.log(`LanguageModel downloaded ${Math.floor(e.loaded * 100)}%`);
                    });
                },
            });
            this.sessionCache.set(cacheKey, session);
        }

        let result: string;
        if (schema) {
            result = await session.prompt(userPrompt, {
                responseConstraint: schema,
                signal: abortSignal,
            });
            try {
                return JSON.parse(result) as T;
            } catch (err) {
                console.warn("Response did not match schema / JSON parse failed", err);
                return result;
            }
        } else {
            result = await session.prompt(userPrompt, { signal: abortSignal });
            return result;
        }
    }

    /**
     * Uses Chrome's Prompt API to ask a question using the LanguageModel and streams the response with caching.
     * @param userPrompt The user's question or prompt.
     * @param systemPrompt Optional system-level context (e.g. "You are a helpful assistant")
     * @param onChunk Callback function to handle each chunk of the response.
     * @param schema Optional JSON Schema to constrain the output.
     * @param abortSignal Optional AbortSignal to cancel the request.
     */
    async askPromptStreaming(
        userPrompt: string,
        systemPrompt: string | undefined,
        onChunk: (chunk: string) => void,
        schema?: object,
        abortSignal?: AbortSignal
    ): Promise<void> {
        if (typeof LanguageModel === "undefined") {
            console.warn("Prompt API not supported in this browser.");
            return;
        }

        const availability = await LanguageModel.availability();
        if (availability === "unavailable") {
            console.warn("Prompt API is unavailable.");
            return;
        }

        const options = {
            signal: abortSignal,
            initialPrompts: systemPrompt ? [{ role: "system", content: systemPrompt }] : undefined,
        };
        const cacheKey = this.getCacheKey(options);
        let session = this.sessionCache.get(cacheKey);

        if (!session) {
            session = await LanguageModel.create({ ...options });
            this.sessionCache.set(cacheKey, session);
        }

        const promptOptions: any = { signal: abortSignal };
        if (schema) {
            promptOptions.responseConstraint = schema;
        }

        const stream = await session.promptStreaming(userPrompt, promptOptions);
        for await (const chunk of stream) {
            onChunk(chunk);
        }
    }

    /**
     * Uses Chrome's Summarizer API to summarize text and streams the response with caching.
     * @param inputText The text to summarize.
     * @param onChunk Callback function to handle each chunk of the response.
     * @param options Options for the summarizer session.
     */
    async summarizeStreaming(
        inputText: string,
        onChunk: (chunk: string) => void,
        options: any = {}
    ): Promise<void> {
        if (typeof Summarizer === "undefined") {
            console.warn("Summarizer API not supported in this browser.");
            return;
        }

        const availability = await Summarizer.availability();
        if (availability === "unavailable") {
            console.warn("Summarizer API is unavailable.");
            return;
        }

        const cacheKey = this.getCacheKey(options);
        let summarizer = this.sessionCache.get(cacheKey);

        if (!summarizer) {
            summarizer = await Summarizer.create(options);
            this.sessionCache.set(cacheKey, summarizer);
        }

        const stream = await summarizer.summarizeStreaming(inputText);
        for await (const chunk of stream) {
            onChunk(chunk);
        }
    }

    /**
     * Generates a response using the Writer API and streams it back.
     * @param prompt The prompt to send to the model.
     * @param messageId A unique ID for the message stream.
     * @param options Options for the writer session.
     */
    async writeStreaming(prompt: string, messageId: string, options: any = {}): Promise<void> {
        const cacheKey = this.getCacheKey(options);
        let writer = this.sessionCache.get(cacheKey);

        if (!writer) {
            const available = await Writer.availability();
            if (available === "available") {
                writer = await Writer.create(options);
            } else {
                writer = await Writer.create({
                    ...options,
                    monitor: (m: any) => {
                        m.addEventListener("downloadprogress", (e: any) => {
                            console.log(`Writer downloaded ${e.loaded * 100}%`);
                        });
                    },
                });
            }
            this.sessionCache.set(cacheKey, writer);
        }

        const stream = await writer.writeStreaming(prompt);
        for await (const chunk of stream) {
            chrome.runtime.sendMessage({
                type: "STREAM_UPDATE",
                payload: { messageId, chunk, isLast: false },
            });
        }

        chrome.runtime.sendMessage({
            type: "STREAM_UPDATE",
            payload: { messageId, chunk: "", isLast: true },
        });
    }

    /**
     * Formats a response using the Writer API based on a question and data.
     * @param question The user's original question.
     * @param mangleResult The data retrieved to answer the question.
     */
    async formatResponse(question: string, mangleResult: any): Promise<void> {
        const messageId = crypto.randomUUID();

        if (typeof Writer === "undefined") {
            console.warn("Writer API is not supported in this browser.");
            chrome.runtime.sendMessage({
                type: "STREAM_UPDATE",
                payload: {
                    messageId,
                    chunk: "The AI writer feature is not available in your browser.",
                    isLast: true,
                },
            });
            return;
        }

        let prompt: string;
        const hasResults = mangleResult && (!Array.isArray(mangleResult) || mangleResult.length > 0);

        if (hasResults) {
            const jsonResult = JSON.stringify(mangleResult, null, 2);
            prompt = `You are a helpful assistant. The user asked: "${question}". The following JSON data was retrieved to answer the question: ${jsonResult}. Please format this data into a friendly, conversational sentence that directly answers the user's question.`;
        } else {
            prompt = `You are a helpful assistant. The user asked: "${question}". Unfortunately, no relevant information was found to answer this. Please inform the user of this in a polite and conversational way.`;
        }

        try {
            await this.writeStreaming(prompt, messageId, {
                sharedContext: "The user is expecting a well formatted markdown response.",
                tone: "neutral",
                format: "markdown",
                length: "short",
            });
        } catch (error) {
            console.error("Error using the Writer API:", error);
            chrome.runtime.sendMessage({
                type: "STREAM_UPDATE",
                payload: {
                    messageId,
                    chunk: "I'm sorry, I encountered an error while trying to generate a response.",
                    isLast: true,
                },
            });
        }
    }
}

export const geminiNanoService = new GeminiNanoService();
