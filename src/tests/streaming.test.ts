import { describe, expect, it } from "bun:test";

/**
 * Simula el parsing de SSE chunks como lo hacen los servicios
 */
function parseSSEChunks(rawData: string): string[] {
    const results: string[] = [];
    const lines = rawData.split("\n");
    let buffer = "";

    for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.startsWith("data: ")) {
            const content = line.slice(6).trim();
            if (content === "[DONE]") break;

            try {
                const json = JSON.parse(content);
                const delta = json.choices?.[0]?.delta?.content;
                if (delta) results.push(delta);
            } catch {
                // Ignorar fragmentos incompletos
            }
        }
    }

    return results;
}

describe("SSE Stream Parsing", () => {
    it("parses valid SSE chunks", () => {
        const rawData = `data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" World"}}]}
data: [DONE]
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual(["Hello", " World"]);
    });

    it("ignores empty lines", () => {
        const rawData = `
data: {"choices":[{"delta":{"content":"Test"}}]}

data: [DONE]
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual(["Test"]);
    });

    it("handles [DONE] signal correctly", () => {
        const rawData = `data: {"choices":[{"delta":{"content":"Before"}}]}
data: [DONE]
data: {"choices":[{"delta":{"content":"After"}}]}
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual(["Before"]);
    });

    it("ignores malformed JSON", () => {
        const rawData = `data: {"choices":[{"delta":{"content":"Valid"}}]}
data: {invalid json here
data: {"choices":[{"delta":{"content":"Also Valid"}}]}
data: [DONE]
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual(["Valid", "Also Valid"]);
    });

    it("handles missing delta content", () => {
        const rawData = `data: {"choices":[{"delta":{}}]}
data: {"choices":[{"delta":{"content":"Has Content"}}]}
data: {"choices":[]}
data: [DONE]
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual(["Has Content"]);
    });

    it("handles empty response", () => {
        const rawData = `data: [DONE]
`;
        const chunks = parseSSEChunks(rawData);
        expect(chunks).toEqual([]);
    });
});

describe("Message Validation", () => {
    function isValidMessage(msg: unknown): boolean {
        return (
            typeof msg === "object" &&
            msg !== null &&
            "role" in msg &&
            "content" in msg &&
            typeof (msg as any).role === "string" &&
            typeof (msg as any).content === "string" &&
            ["system", "user", "assistant"].includes((msg as any).role)
        );
    }

    it("validates correct message structure", () => {
        expect(isValidMessage({ role: "user", content: "Hello" })).toBe(true);
        expect(isValidMessage({ role: "assistant", content: "Hi" })).toBe(true);
        expect(isValidMessage({ role: "system", content: "Prompt" })).toBe(true);
    });

    it("rejects invalid role", () => {
        expect(isValidMessage({ role: "invalid", content: "Hello" })).toBe(false);
    });

    it("rejects missing content", () => {
        expect(isValidMessage({ role: "user" })).toBe(false);
    });

    it("rejects missing role", () => {
        expect(isValidMessage({ content: "Hello" })).toBe(false);
    });

    it("rejects null and undefined", () => {
        expect(isValidMessage(null)).toBe(false);
        expect(isValidMessage(undefined)).toBe(false);
    });

    it("rejects non-object types", () => {
        expect(isValidMessage("string")).toBe(false);
        expect(isValidMessage(123)).toBe(false);
        expect(isValidMessage([])).toBe(false);
    });
});
