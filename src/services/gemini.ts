import type { AIService, ChatMessage } from "../types";

export class GeminiService implements AIService {
    name = "Gemini";
    private apiKey = process.env.GEMINI_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("GEMINI_API_KEY is missing");

        // Usando Gemini API nativa con streaming
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${this.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: messages.map(m => ({
                    role: m.role === "assistant" ? "model" : m.role === "system" ? "user" : m.role,
                    parts: [{ text: m.content }]
                })),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
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
                        // Gemini native format: candidates[0].content.parts[0].text
                        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) yield text;
                    } catch (e) {
                        // Ignorar fragmentos incompletos
                    }
                }
            }
        }
    }
}
