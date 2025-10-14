# syntax=docker/dockerfile:1.4

# Enable BuildKit support
# DOCKER_BUILDKIT=1 docker build -t namefi-astra-backend .

# Stage 1: Setup base with Node.js 22 Debian Bullseye
FROM node:jod-bullseye AS base
WORKDIR /app

# Set to production environment
ENV NODE_ENV production
ENV ENVIRONMENT=production
ENV NODE_OPTIONS="--max-old-space-size=2048"


RUN apt-get update && apt-get install -y bash curl dnsutils
# RUN curl -1sLf \
# 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
# && apt-get update && apt-get install -y infisical

# Stage 2: Use Bun for dependency installation
FROM oven/bun:1.2.23-debian AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY . .

# Install dependencies using Bun (faster than npm)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install 
# --frozen-lockfile

# Stage 3: Build stage with Node.js
FROM base AS builder
WORKDIR /app

# Copy the entire monorepo and the installed dependencies
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Build the backend application
WORKDIR /app/apps/backend
RUN npm run build:prod
# Bundle the workflows
RUN npm run bundle:workflows

# Stage 4: Runtime image
FROM base AS runner
WORKDIR /app

# Copy package.json and built application
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/dist ./dist
# Copy the infisical secret file
COPY --from=builder /app/.infisical.json ./.infisical.json
# Copy the node_modules
COPY --from=deps /app/node_modules ./node_modules

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Default port for the app (can be overridden by setting the PORT environment variable at runtime)
EXPOSE 3000

# Start the application with Node.js
CMD ["npm", "start"] 
## https://infisical.com/docs/integrations/platforms/docker