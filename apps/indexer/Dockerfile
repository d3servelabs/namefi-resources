# syntax=docker/dockerfile:1.4

# Enable BuildKit support
# DOCKER_BUILDKIT=1 docker build -t namefi-astra-indexer .

# the app doesn't have a build process yet, so we're just basically containerizing the app for deployment

# Stage 1: Setup base with Node.js 22 Debian Bullseye
FROM node:jod-alpine3.22 AS base
WORKDIR /app

# Set to production environment
ENV NODE_ENV production
ENV CI true
# RUN curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
# && apt-get update && apt-get install -y infisical

# Stage 2: Prune the monorepo to only include indexer dependencies
FROM node:jod-alpine3.22 AS pruner
WORKDIR /app
ENV CI true
# Install turbo globally
RUN npm install -g turbo@2.9.1

# Copy the entire monorepo
COPY . .

# Prune the monorepo for the indexer app
RUN turbo prune @namefi-astra/indexer --docker

# Stage 3: Use Bun for dependency installation
FROM oven/bun:1.3.11 AS deps
WORKDIR /app
ENV CI true
# `out/json` now includes the pruned lockfile and bunfig with Turbo 2.9.
COPY --from=pruner /app/out/json/ .

# Install dependencies using Bun (faster than npm)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile --ignore-scripts


# Stage 4: Runtime image
FROM base AS runner
WORKDIR /app

ARG PORT
ENV PORT=${PORT:-3000}
ENV CI true
# Copy pruned source code
COPY --from=pruner /app/out/full/ .
# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules


# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# ponder start updates the config file format for some reason (so it crashes without write permissions)
RUN chown -R nodejs:nodejs /app
RUN chmod -R 777 /app/apps/indexer

USER nodejs


# Default port for the app (can be overridden by setting the PORT environment variable at runtime)
EXPOSE ${PORT}

WORKDIR /app/apps/indexer

# Start the application with schema generation
CMD ["npm", "run", "start"]

## https://infisical.com/docs/integrations/platforms/docker
