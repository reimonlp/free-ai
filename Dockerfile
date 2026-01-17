FROM oven/bun:1

WORKDIR /app

# Instalar dependencias primero para aprovechar la caché de capas
COPY package.json bun.lock* ./
RUN bun install --production

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["bun", "run", "src/index.ts"]
