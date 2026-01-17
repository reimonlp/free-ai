import type { AIService, ChatMessage } from "../types";

export class CohereService implements AIService {
    name = "Cohere";
    private apiKey = process.env.COHERE_API_KEY;

    async *chat(messages: ChatMessage[]) {
        if (!this.apiKey) throw new Error("COHERE_API_KEY is missing");

        // Convertir formato de mensajes a formato Cohere
        const chatHistory = messages.slice(0, -1).map(m => ({
            role: m.role === "assistant" ? "CHATBOT" : "USER",
            message: m.content
        }));

        const lastMessage = messages[messages.length - 1];

        const response = await fetch("https://api.cohere.com/v1/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "command-r-plus-08-2024",
                message: lastMessage?.content || "",
                chat_history: chatHistory,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cohere API error: ${response.statusText} - ${errorText}`);
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

                try {
                    const json = JSON.parse(line);
                    if (json.event_type === "text-generation") {
                        yield json.text;
                    }
                } catch (e) {
                    // Ignorar
                }
            }
        }
    }
}
