import { handleProcessQuestion } from "@/service-worker-2/handlers/questionHandler";
import { runQueryAndFormatResponse } from "@/service-worker-2/handlers/hotelDataHandler";
import { describe, test, expect, vi } from "vitest";

vi.mock("@/service-worker-2/handlers/hotelDataHandler", () => ({
    runQueryAndFormatResponse: vi.fn(),
}));

describe("handleProcessQuestion", () => {
    test("should call runQueryAndFormatResponse with the question", async () => {
        const question = "Which hotels have a rating of 9.0 or higher?";
        await handleProcessQuestion(question);
        expect(runQueryAndFormatResponse).toHaveBeenCalledWith(question);
    });
});
