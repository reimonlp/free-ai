import type { AIService, ChatMessage } from "../types";

export class CloudflareService implements AIService {
    name = "Cloudflare";
    private apiKey = process.env.CLOUDFLARE_API_KEY;
    private accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("CLOUDFLARE_API_KEY is missing");
        if (!this.accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID is missing");

        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudflare API error: ${response.statusText} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.trim() === "") continue;
                if (line.startsWith("data: ")) {
                    const content = line.slice(6).trim();
                    if (content === "[DONE]") return;

                    try {
                        const json = JSON.parse(content);
                        const text = json.response;
                        if (text) yield text;
                    } catch (e) {
                        // Ignorar
                    }
                }
            }
        }
    }
}
