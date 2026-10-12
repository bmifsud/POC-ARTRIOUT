FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
