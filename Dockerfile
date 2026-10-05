# Stage 1: Build environment
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations and manifests
COPY package*.json tsconfig.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY public/ ./public/
COPY scripts/ ./scripts/
COPY src/ ./src/
COPY tests/ ./tests/

# Build production artifacts
RUN node scripts/build.js

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy generated dist artifacts and static server
COPY --from=builder /app/dist ./public
COPY scripts/serve.js ./scripts/serve.js

EXPOSE 3000

USER node

CMD ["node", "scripts/serve.js"]
