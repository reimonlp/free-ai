import { describe, expect, it, beforeEach, mock } from "bun:test";
import { getNextService } from "../services";

describe("Round-Robin Service Selection", () => {
    it("returns a service with a name", () => {
        const service = getNextService();
        expect(service.name).toBeDefined();
        expect(typeof service.name).toBe("string");
    });

    it("rotates through all 6 services", () => {
        const names: string[] = [];

        // Obtener 6 servicios consecutivos
        for (let i = 0; i < 6; i++) {
            const service = getNextService();
            names.push(service.name);
        }

        // Verificar que todos son únicos
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(6);
    });

    it("returns to first service after cycling through all", () => {
        // Obtener los primeros 6 servicios
        const firstRound: string[] = [];
        for (let i = 0; i < 6; i++) {
            firstRound.push(getNextService().name);
        }

        // El próximo debería ser el primero otra vez
        const nextService = getNextService();
        expect(nextService.name).toBe(firstRound[0] as string);
    });

    it("service has chat method", () => {
        const service = getNextService();
        expect(typeof service.chat).toBe("function");
    });
});

describe("Service Names", () => {
    it("includes expected service providers", () => {
        const allNames: string[] = [];
        for (let i = 0; i < 12; i++) {
            allNames.push(getNextService().name);
        }

        const uniqueNames = new Set(allNames);

        // Verificar que hay 6 servicios
        expect(uniqueNames.size).toBe(6);

        // Verificar algunos nombres esperados
        expect(uniqueNames.has("Groq")).toBe(true);
        expect(uniqueNames.has("Cerebras")).toBe(true);
    });
});
