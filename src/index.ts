import { chatWithFallback } from "./services";
import type { ChatMessage } from "./types";

function isValidMessage(msg: unknown): msg is ChatMessage {
    return (
        typeof msg === "object" &&
        msg !== null &&
        "role" in msg &&
        "content" in msg &&
        typeof (msg as ChatMessage).role === "string" &&
        typeof (msg as ChatMessage).content === "string" &&
        ["system", "user", "assistant"].includes((msg as ChatMessage).role)
    );
}

const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // Health check formal para Docker
        if (url.pathname === "/health" && req.method === "GET") {
            return Response.json({ status: "ok", timestamp: new Date().toISOString() });
        }

        // Health check simple
        if (url.pathname === "/" && req.method === "GET") {
            return new Response("Free AI Proxy is running!");
        }

        // Chat endpoint
        if (url.pathname === "/chat" && req.method === "POST") {
            // Fix 1: Validación de JSON malformado
            let body: { messages?: unknown };
            try {
                body = await req.json() as { messages?: unknown };
            } catch {
                return new Response("Invalid JSON body", { status: 400 });
            }

            const { messages } = body;

            // Fix 6: Validación de estructura de mensajes
            if (!messages || !Array.isArray(messages)) {
                return new Response("Invalid messages: must be an array", { status: 400 });
            }

            if (messages.length === 0) {
                return new Response("Invalid messages: array cannot be empty", { status: 400 });
            }

            if (!messages.every(isValidMessage)) {
                return new Response("Invalid messages: each message must have 'role' and 'content'", { status: 400 });
            }

            const stream = chatWithFallback(messages as ChatMessage[]);

            return new Response(
                new ReadableStream({
                    async start(controller) {
                        const encoder = new TextEncoder();
                        try {
                            for await (const chunk of stream) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
                            }
                            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            controller.close();
                        } catch (error: unknown) {
                            const errorMessage = error instanceof Error ? error.message : "Unknown error";
                            console.error("All services failed:", error);
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
                            controller.close();
                        }
                    },
                }),
                {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    },
                }
            );
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Servidor escuchando en http://localhost:${server.port}`);
