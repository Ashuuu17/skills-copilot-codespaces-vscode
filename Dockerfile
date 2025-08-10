# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install development dependencies
RUN npm ci

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p server/uploads server/logs

# Expose ports
EXPOSE 3000 5000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p server/uploads server/logs && \
    chown -R nodejs:nodejs server/uploads server/logs

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start production server
CMD ["npm", "start"]

# Build stage for client
FROM node:18-alpine AS client-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm ci

# Copy client source code
COPY client/ .

# Build client
RUN npm run build

# Production stage with client
FROM base AS production-with-client

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built client from builder stage
COPY --from=client-builder --chown=nodejs:nodejs /app/client/build ./client/build

# Copy server source code
COPY --chown=nodejs:nodejs server/ ./server/

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs server/package*.json ./server/

# Create necessary directories
RUN mkdir -p server/uploads server/logs && \
    chown -R nodejs:nodejs server/uploads server/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start production server
CMD ["npm", "start"]