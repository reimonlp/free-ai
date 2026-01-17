import { GroqService } from "./groq";
import { CerebrasService } from "./cerebras";
import { SambaNovaService } from "./sambanova";
import { GeminiService } from "./gemini";
import { DeepSeekService } from "./deepseek";
import type { AIService } from "../types";

const services: AIService[] = [
    new GroqService(),
    new CerebrasService(),
    new SambaNovaService(),
    new GeminiService(),
    new DeepSeekService(),
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
