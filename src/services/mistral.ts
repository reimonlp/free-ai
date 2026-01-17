import type { AIService, ChatMessage } from "../types";

export class MistralService implements AIService {
    name = "Mistral";
    private apiKey = process.env.MISTRAL_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("MISTRAL_API_KEY is missing");

        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API error: ${response.statusText} - ${errorText}`);
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
