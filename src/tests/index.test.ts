import { describe, expect, it, beforeAll, afterAll } from "bun:test";

const BASE_URL = "http://localhost:3001";
let server: ReturnType<typeof Bun.serve>;

beforeAll(() => {
    // Iniciar servidor en puerto de test
    server = Bun.serve({
        port: 3001,
        async fetch(req) {
            // Importamos dinámicamente para tener el fetch handler
            const module = await import("../index");
            return (module as any).default?.fetch?.(req) ?? new Response("Test server");
        },
    });
});

afterAll(() => {
    server.stop();
});

describe("Server Endpoints", () => {
    describe("GET /", () => {
        it("returns 200 with running message", async () => {
            const res = await fetch(`${BASE_URL}/`);
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain("running");
        });
    });

    describe("GET /health", () => {
        it("returns 200 with JSON status", async () => {
            const res = await fetch(`${BASE_URL}/health`);
            expect(res.status).toBe(200);
            const json = await res.json();
            expect(json.status).toBe("ok");
            expect(json.timestamp).toBeDefined();
        });
    });

    describe("GET /nonexistent", () => {
        it("returns 404", async () => {
            const res = await fetch(`${BASE_URL}/nonexistent`);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /chat", () => {
        it("returns 400 for invalid JSON", async () => {
            const res = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "not valid json",
            });
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain("Invalid JSON");
        });

        it("returns 400 for missing messages", async () => {
            const res = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain("must be an array");
        });

        it("returns 400 for empty messages array", async () => {
            const res = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [] }),
            });
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain("cannot be empty");
        });

        it("returns 400 for invalid message structure", async () => {
            const res = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ invalid: true }] }),
            });
            expect(res.status).toBe(400);
            const text = await res.text();
            expect(text).toContain("role");
        });

        it("returns 400 for invalid role", async () => {
            const res = await fetch(`${BASE_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ role: "invalid", content: "test" }] }),
            });
            expect(res.status).toBe(400);
        });
    });
});
