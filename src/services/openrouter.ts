import type { AIService, ChatMessage } from "../types";

export class OpenRouterService implements AIService {
    name = "OpenRouter";
    private apiKey = process.env.OPENROUTER_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("OPENROUTER_API_KEY is missing");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                "HTTP-Referer": "https://free-ai-proxy.local",
                "X-Title": "Free AI Proxy",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.statusText} - ${errorText}`);
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
                        const delta = json.choices?.[0]?.delta?.content;
                        if (delta) yield delta;
                    } catch (e) {
                        // Ignorar fragmentos incompletos
                    }
                }
            }
        }
    }
}
