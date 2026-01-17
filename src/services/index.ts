import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { SambaNovaService } from "./sambanova";
import { GeminiService } from "./gemini";
import { OpenRouterService } from "./openrouter";
import { MistralService } from "./mistral";
import { AI21Service } from "./ai21";
import { CohereService } from "./cohere";
import { CloudflareService } from "./cloudflare";
import type { AIService, ChatMessage } from "../types";

const services: AIService[] = [
    new GroqService(),
    new CerebrasService(),
    new SambaNovaService(),
    new GeminiService(),
    new OpenRouterService(),
    new MistralService(),
    new AI21Service(),
    new CohereService(),
    new CloudflareService(),
];

let currentIndex = 0;

export function getNextService(): AIService {
    const service = services[currentIndex];
    if (!service) {
        throw new Error(`Servicio en el índice ${currentIndex} no encontrado`);
    }
    currentIndex = (currentIndex + 1) % services.length;
    console.log(`Usando servicio: ${service.name} (Índice: ${currentIndex})`);
    return service;
}

export function getServicesCount(): number {
    return services.length;
}

/**
 * Intenta obtener una respuesta de los servicios con fallback automático.
 * Si un servicio falla, intenta con el siguiente hasta probar todos.
 */
export async function* chatWithFallback(messages: ChatMessage[]): AsyncGenerator<string> {
    const errors: string[] = [];
    const totalServices = services.length;

    for (let attempts = 0; attempts < totalServices; attempts++) {
        const service = getNextService();

        try {
            console.log(`Intentando con ${service.name}...`);

            // Intentamos obtener el primer chunk para verificar que funciona
            const stream = service.chat(messages);
            let firstChunk = true;

            for await (const chunk of stream) {
                if (firstChunk) {
                    console.log(`✓ ${service.name} respondió correctamente`);
                    firstChunk = false;
                }
                yield chunk;
            }

            // Si llegamos aquí, el servicio funcionó
            return;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`✗ ${service.name} falló: ${errorMessage}`);
            errors.push(`${service.name}: ${errorMessage}`);

            // Continuar con el siguiente servicio
            continue;
        }
    }

    // Si llegamos aquí, todos los servicios fallaron
    throw new Error(`Todos los servicios fallaron:\n${errors.join('\n')}`);
}
