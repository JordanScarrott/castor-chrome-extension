import { db } from '@/db';

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
            format: "plain-text",
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

        // if (!navigator.userActivation.isActive) {
        //     console.warn("User interaction required before summarization.");
        //     return "";
        // }

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
        console.log(
            "🚀 ~ GeminiNanoService ~ askPromptStreaming ~ userPrompt:",
            userPrompt
        );
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
            const options: any = { signal: abortSignal };
            if (schema) {
                options.responseConstraint = schema;
            }

            // Get a streaming response
            const stream = await session.promptStreaming(userPrompt, options);

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

        // if (!navigator.userActivation.isActive) {
        //     console.warn("User interaction required before summarization.");
        //     return;
        // }

        const summarizer = await Summarizer.create();
        const stream = await summarizer.summarizeStreaming(inputText);

        for await (const chunk of stream) {
            onChunk(chunk);
        }
    }
}

export const geminiNanoService = new GeminiNanoService();

// Make sure the Writer API types are declared if not globally available
declare const Writer: any;

export async function formatResponseWithAI(
    question: string,
    mangleResult: any,
    conversationId: number
): Promise<void> {
    console.log("🚀 ~ formatResponseWithAI ~ question:", question);

    const assistantMessageId = await db.messages.add({
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
    });

    // 1. Check for Writer API availability
    if (typeof Writer === "undefined") {
        console.warn("Writer API is not supported in this browser.");
        const errorMessage = "The AI writer feature is not available in your browser.";
        await db.messages.update(assistantMessageId, { content: errorMessage, isStreaming: false });
        return;
    }

    // 2. Generate a high-quality prompt based on the mangle result
    let prompt: string;
    const hasResults =
        mangleResult &&
        (!Array.isArray(mangleResult) || mangleResult.length > 0);

    if (hasResults) {
        const jsonResult = JSON.stringify(mangleResult, null, 2);
        console.log("🚀 ~ formatResponseWithAI ~ jsonResult:", jsonResult);
        prompt = `You are a helpful assistant. The user asked: "${question}". The following JSON data was retrieved to answer the question: ${jsonResult}. Please format this data into a friendly, conversational sentence that directly answers the user's question.`;
    } else {
        prompt = `You are a helpful assistant. The user asked: "${question}". Unfortunately, no relevant information was found to answer this. Please inform the user of this in a polite and conversational way.`;
    }

    // 3. Use the Writer API to generate the final response
    try {
        await geminiNanoWriteStreaming(prompt, assistantMessageId);
    } catch (error) {
        console.error("Error using the Writer API:", error);
        const errorMessage = "I'm sorry, I encountered an error while trying to generate a response.";
        await db.messages.update(assistantMessageId, { content: errorMessage, isStreaming: false });
    }
}

async function geminiNanoWriteStreaming(
    prompt: string,
    messageId: number
): Promise<void> {
    const options = {
        sharedContext:
            "The user is expecting a well formatted markdown response.",
        tone: "neutral",
        format: "markdown",
        length: "short",
    };

    const available = await Writer.availability();
    let writer;

    if (available === "available") {
        // The Writer API can be used immediately .
        writer = await Writer.create(options);
    } else {
        // The Writer can be used after the model is downloaded.
        writer = await Writer.create({
            ...options,
            monitor(m: any) {
                m.addEventListener("downloadprogress", (e: any) => {
                    console.log(`Downloaded ${e.loaded * 100}%`);
                });
            },
        });
    }

    const stream = await writer.writeStreaming(prompt);
    let fullContent = '';
    for await (const chunk of stream) {
        fullContent += chunk;
        await db.messages.update(messageId, { content: fullContent });
    }

    await db.messages.update(messageId, { isStreaming: false });
}

async function geminiNanoSummariseStreaming(): Promise<void> {
    const options = {
        sharedContext: "This is a scientific article",
        type: "key-points",
        format: "markdown",
        length: "medium",
        monitor(m: any) {
            m.addEventListener("downloadprogress", (e) => {
                console.log(`Downloaded ${e.loaded * 100}%`);
            });
        },
    };

    const availability = await Summarizer.availability();
    if (availability === "unavailable") {
        // The Summarizer API isn't usable.
        console.log("The Summarizer API isn't usable.");
    } else {
        // Check for user activation before creating the summarizer
        if (navigator.userActivation.isActive) {
            const summarizer = await Summarizer.create(options);
            const longText = ``;
            const stream = summarizer.summarizeStreaming(longText, {
                context: "This is a travel website about wine tours",
            });

            let outputSummary = "";
            for await (const chunk of stream) {
                outputSummary = outputSummary + chunk;
                console.log(outputSummary);
            }
        }
    }
}
