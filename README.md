# 🤖 Free AI Proxy

Un proxy que rota automáticamente entre **9 servicios de IA gratuitos**, proporcionando acceso a modelos potentes sin costo.

## ✨ Características

- 🔄 **Round-Robin automático** entre 9 servicios de IA
- 🛡️ **Fallback inteligente**: si un servicio falla, intenta con el siguiente
- 📡 **Streaming SSE**: respuestas en tiempo real
- 🐳 **Docker ready**: listo para producción
- 🏥 **Healthcheck**: monitoreo automático

## 🚀 Servicios Incluidos

| Servicio | Modelo | Límite Gratuito |
|----------|--------|-----------------|
| **Groq** | Llama 3.3 70B | 6,000 req/día |
| **Cerebras** | Llama 3.3 70B | Alto throughput |
| **SambaNova** | Llama 3.3 70B | Alto throughput |
| **Gemini** | Gemini 2.0 Flash | 1,500 req/día |
| **OpenRouter** | Llama 3.3 70B | 200 req/día |
| **Mistral** | Mistral Small | Tier gratuito |
| **AI21** | Jamba Large | $10 créditos/3 meses |
| **Cohere** | Command R+ 08-2024 | 1,000 req/mes |
| **Cloudflare** | Llama 3.3 70B FP8 | 10,000 neurons/día |

## 📦 Instalación

### Requisitos
- [Bun](https://bun.sh/) v1.0+ (para desarrollo local)
- Docker y Docker Compose (para producción)

### 1. Clonar el repositorio
```bash
git clone <tu-repo>
cd free-ai
```

### 2. Configurar API Keys
```bash
cp .env.example .env
```

Edita `.env` con tus API keys:
```env
GROQ_API_KEY=tu_key
CEREBRAS_API_KEY=tu_key
SAMBANOVA_API_KEY=tu_key
GEMINI_API_KEY=tu_key
OPENROUTER_API_KEY=tu_key
MISTRAL_API_KEY=tu_key
AI21_API_KEY=tu_key
COHERE_API_KEY=tu_key
CLOUDFLARE_API_KEY=tu_key
CLOUDFLARE_ACCOUNT_ID=tu_account_id
```

### 3. Obtener API Keys

| Servicio | URL |
|----------|-----|
| Groq | [console.groq.com](https://console.groq.com/) |
| Cerebras | [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| SambaNova | [cloud.sambanova.ai](https://cloud.sambanova.ai/) |
| Gemini | [aistudio.google.com](https://aistudio.google.com/) |
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Mistral | [console.mistral.ai](https://console.mistral.ai/) |
| AI21 | [studio.ai21.com](https://studio.ai21.com/) |
| Cohere | [dashboard.cohere.com](https://dashboard.cohere.com/) |
| Cloudflare | [dash.cloudflare.com](https://dash.cloudflare.com/) |

## 🏃 Ejecución

### Desarrollo local
```bash
bun install
bun run src/index.ts
```

### Docker
```bash
# Construir e iniciar
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

## 📡 Uso de la API

### Endpoint de Chat
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hola, ¿cómo estás?"}
    ]
  }'
```

### Respuesta (SSE Stream)
```
data: {"content":"¡Hola"}
data: {"content":"! Estoy"}
data: {"content":" muy bien"}
data: {"content":", gracias"}
data: [DONE]
```

### Health Check
```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2024-01-17T12:00:00.000Z"}
```

## 🔧 Estructura del Proyecto

```
free-ai/
├── src/
│   ├── index.ts          # Servidor principal
│   ├── types.ts          # Interfaces TypeScript
│   └── services/         # Implementación de cada servicio
│       ├── index.ts      # Lógica de rotación y fallback
│       ├── groq.ts
│       ├── cerebras.ts
│       ├── sambanova.ts
│       ├── gemini.ts
│       ├── openrouter.ts
│       ├── mistral.ts
│       ├── ai21.ts
│       ├── cohere.ts
│       └── cloudflare.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## 🧪 Tests

```bash
bun test
```

## 🔒 Características de Seguridad

- ✅ Validación de JSON en requests
- ✅ Validación de estructura de mensajes
- ✅ Manejo de errores con fallback
- ✅ API keys en variables de entorno
- ✅ Healthcheck para monitoreo

## 📊 Monitoreo con Docker

El contenedor incluye:
- **Healthcheck** cada 30 segundos
- **Restart automático** si falla
- **Límite de memoria**: 512MB
- **Logging** con rotación (10MB × 3 archivos)

```bash
# Ver estado del contenedor
docker ps

# Ver salud del contenedor
docker inspect --format='{{.State.Health.Status}}' free-ai-proxy
```

## 🤝 Contribuir

1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

MIT

---

**⭐ Si te resultó útil, dejá una estrella en el repo!**
