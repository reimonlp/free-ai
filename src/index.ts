import { getNextService } from "./services";
import type { ChatMessage } from "./types";

const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        // Health check
        if (url.pathname === "/" && req.method === "GET") {
            return new Response("Free AI Proxy is running!");
        }

        // Chat endpoint
        if (url.pathname === "/chat" && req.method === "POST") {
            try {
                const { messages } = (await req.json()) as { messages: ChatMessage[] };

                if (!messages || !Array.isArray(messages)) {
                    return new Response("Invalid messages", { status: 400 });
                }

                const service = getNextService();
                const stream = service.chat(messages);

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
                            } catch (error: any) {
                                console.error(`Error in ${service.name} stream:`, error);
                                controller.error(error);
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
            } catch (error: any) {
                console.error("Server error:", error);
                return new Response(error.message, { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

console.log(`Servidor escuchando en http://localhost:${server.port}`);
