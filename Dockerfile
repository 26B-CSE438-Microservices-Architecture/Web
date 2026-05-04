# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/dist/restaurant-admin-panel ./dist/restaurant-admin-panel

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Expose the port
EXPOSE 4200

# Set environment variables
ENV PORT=4200
ENV NODE_ENV=production
ENV NODE_OPTIONS=--no-deprecation

# Run the server
CMD ["node", "dist/restaurant-admin-panel/server/server.mjs"]
