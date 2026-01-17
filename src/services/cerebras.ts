import type { AIService, ChatMessage } from "../types";

export class CerebrasService implements AIService {
    name = "Cerebras";
    private apiKey = process.env.CEREBRAS_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("CEREBRAS_API_KEY is missing");

        const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "llama3.3-70b",
                messages,
                stream: true,
            }),
        });

        if (!response.ok) throw new Error(`Cerebras API error: ${response.statusText}`);

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
                if (line.startsWith("data: ")) {
                    const content = line.slice(6);
                    if (content === "[DONE]") return;

                    try {
                        const json = JSON.parse(content);
                        const delta = json.choices[0]?.delta?.content;
                        if (delta) yield delta;
                    } catch (e) {
                        // Ignorar
                    }
                }
            }
        }
    }
}
