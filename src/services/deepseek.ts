import type { AIService, ChatMessage } from "../types";

export class DeepSeekService implements AIService {
    name = "DeepSeek";
    private apiKey = process.env.DEEPSEEK_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("DEEPSEEK_API_KEY is missing");

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`DeepSeek API error: ${response.statusText} - ${errorText}`);
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
