# ==========================================
# SIGMA-CB - Dockerfile de Produção
# Multi-stage build otimizado para Node.js
# ==========================================

# Estágio 1: Build da Aplicação
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código-fonte
COPY . .

# Compilar frontend e assets
RUN npm run build

# ==========================================
# Estágio 2: Imagem Final de Execução
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Criar usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sigmacb

# Copiar dependências e build do estágio anterior
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/data ./data

# Criar diretório de dados persistentes com permissão para o usuário
RUN mkdir -p /app/data && chown -R sigmacb:nodejs /app/data

USER sigmacb

EXPOSE 3000

# Healthcheck do serviço
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
