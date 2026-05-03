# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production
ENV PORT=4200
ENV API_BASE_URL=http://gateway:8080

EXPOSE 4200

CMD ["node", "dist/restaurant-admin-panel/server/server.mjs"]

