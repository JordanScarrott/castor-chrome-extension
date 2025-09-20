import { usePrompt } from "@/modules/geminiNano/composables/geminiNanoComposable";
import { geminiNanoService } from "@/modules/geminiNano/service/geminiNanoService";
import { exampleText } from "@/tests/core/service/exampleData";
import { describe, expect, test, vi } from "vitest";

// Mock the global objects
vi.stubGlobal("LanguageModel", {
    availability: vi.fn().mockResolvedValue("available"),
    create: vi.fn().mockResolvedValue({
        promptStreaming: vi.fn().mockImplementation(async function* () {
            yield "This ";
            yield "is ";
            yield "a ";
            yield "test.";
        }),
        destroy: vi.fn(),
        prompt: vi.fn().mockResolvedValue("This is a test."),
    }),
});

describe("geminiNanoService", () => {
    test("v2 prompt", async () => {
        const response = await usePrompt().prompt(exampleText(2));
        expect(response).toBe("This is a test.");
    });

    test("askPromptStreaming", async () => {
        let fullResponse = "";
        const onChunk = (chunk: string) => {
            fullResponse += chunk;
        };
        await geminiNanoService.askPromptStreaming(
            "test prompt",
            undefined,
            onChunk
        );
        expect(fullResponse).toBe("This is a test.");
    });

    test("summarizeStreaming", async () => {
        let fullResponse = "";
        const onChunk = (chunk: string) => {
            fullResponse += chunk;
        };
        await geminiNanoService.summarizeStreaming("test text", onChunk);
        expect(fullResponse).toBe("This is a test.");
    });
});
