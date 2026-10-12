# Stage 1: Build WASM artifacts using Emscripten
FROM emscripten/emsdk:3.1.53 AS wasm-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:wasm

# Stage 2: Build the production Node.js application
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=wasm-builder /app/public/wasm/ar_renderer.wasm /app/public/wasm/
COPY --from=wasm-builder /app/public/wasm/ar_renderer.js /app/public/wasm/
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["node", "scripts/serve.js"]
