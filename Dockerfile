# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Instalar dependencias
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile

# Production stage
FROM oven/bun:1

WORKDIR /app

# Copiar dependencias desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copiar código fuente
COPY src ./src

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio
CMD ["bun", "run", "src/index.ts"]
