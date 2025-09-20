import { useMangle } from "@/modules/mangle/composables/useMangle";
import { describe, expect, it } from "vitest";

describe("useMangle", () => {
    it("mangles text correctly", () => {
        const { mangle } = useMangle();
        const result = mangle("hello");
        expect(result).toBe("olleh");
    });
});
