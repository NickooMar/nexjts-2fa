# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
# Copy source code
COPY . .

# Install dependencies and build
RUN npm install
RUN npm run build auth

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Set environment and expose port
ENV NODE_ENV=production
EXPOSE 3001

# Start the application
CMD ["node", "dist/apps/auth/main"]