FROM emscripten/emsdk:3.1.44 as builder
RUN apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
WORKDIR /app
COPY . .
RUN rm -rf node_modules package-lock.json && npm install
RUN npm run build:wasm

FROM node:20-alpine
WORKDIR /app
COPY . .
COPY --from=builder /app/public/wasm/ar_renderer.js ./public/wasm/
COPY --from=builder /app/public/wasm/ar_renderer.wasm ./public/wasm/
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["node", "scripts/serve.js"]
