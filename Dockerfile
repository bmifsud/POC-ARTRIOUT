FROM emscripten/emsdk:3.1.53 as wasm-builder
WORKDIR /app
COPY . .
RUN npm ci
RUN npx -y tsx packages/rendering/scripts/build-wasm.js

FROM node:20-alpine
WORKDIR /app
COPY . .
COPY --from=wasm-builder /app/public/wasm/ar_renderer.wasm ./public/wasm/ar_renderer.wasm
COPY --from=wasm-builder /app/public/wasm/ar_renderer.js ./public/wasm/ar_renderer.js
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
