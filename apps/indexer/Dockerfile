# syntax=docker/dockerfile:1.4

# Enable BuildKit support
# DOCKER_BUILDKIT=1 docker build -t namefi-astra-backend .

# the app doesn't have a build process yet, so we're just basically containerizing the app for deployment 

# Stage 1: Setup base with Node.js 22 Debian Bullseye
FROM node:jod-bullseye AS base
WORKDIR /app

# Set to production environment
ENV NODE_ENV production
ENV ENVIRONMENT=production


RUN apt-get update && apt-get install -y bash curl dnsutils && curl -1sLf \
'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
&& apt-get update && apt-get install -y infisical

# Stage 2: Use Bun for dependency installation
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY . .

# Install dependencies using Bun (faster than npm)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install
# --frozen-lockfile


# Stage 4: Runtime image
FROM base AS runner
WORKDIR /app

ARG PORT
ENV PORT=${PORT:-3000}

# Copy package.json and built application
# COPY --from=deps /app/apps/indexer/* /app
# Copy the infisical secret file
# COPY --from=deps /app/.infisical.json ./.infisical.json
# Copy the node_modules
# COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app /app


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
CMD ["infisical", "run", "--", "./scripts/start-with-schema.sh"] 

## https://infisical.com/docs/integrations/platforms/docker