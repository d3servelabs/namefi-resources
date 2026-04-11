# syntax=docker/dockerfile:1.4

# Enable BuildKit support
# DOCKER_BUILDKIT=1 docker build -t namefi-astra-backend .

#
# ##############################################################################
# Stage 1: Setup base with Node.js 22 Debian Bullseye
# ##############################################################################
#
FROM node:jod-bullseye-slim AS base
WORKDIR /app

# Set to production environment
ENV NODE_ENV production
ENV ENVIRONMENT=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV CI="true"

RUN apt-get update && apt-get install -y bash curl dnsutils


#
# ##############################################################################
# Stage 2: Prune the monorepo to only include backend dependencies
# ##############################################################################
#
FROM node:jod-bullseye-slim AS pruner
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo@2.9.5
# Copy the entire monorepo
COPY . .
# Prune the monorepo for the backend app
RUN turbo prune @namefi-astra/backend --docker


#
# ##############################################################################
# Stage 3: Use Bun for dependency installation
# ##############################################################################
#
FROM oven/bun:1.3.11-slim AS deps_prod
ENV CI="true"
WORKDIR /app

# Copy the pruned lockfile and package.json files emitted by Turbo.
COPY --from=pruner /app/out/json/ .
# coredns-client generates types in postinstall from a checked-in OpenAPI spec,
# so its pruned source needs to be present before dependency installation.
COPY --from=pruner /app/out/full/packages/coredns-client ./packages/coredns-client
# Bun executes the root prepare script during install, so copy the script
# explicitly because Turbo's json output only includes root package manifests.
COPY ./scripts/prepare.sh ./scripts/prepare.sh
COPY ./bunfig.toml ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile --production

FROM deps_prod AS deps_build
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile


#
# ##############################################################################
# Stage 4: Build stage with Node.js
# ##############################################################################
#
FROM deps_build AS base_builder
# Overlay the pruned source code onto the already-installed dependency tree.
COPY --from=pruner /app/out/full/ ./
WORKDIR /app/apps/backend

# Stage 4.a: Build stage with Node.js
FROM base_builder AS backend_builder
RUN bun run build:prod
# Stage 4.b: Build temporal workflows
FROM base_builder AS temporal_builder
# Bundle the workflows
RUN bun run bundle:workflows


#
# ##############################################################################
# Stage 5: Runtime image
# ##############################################################################
#
FROM base AS runner
WORKDIR /app

# Copy only the runtime dependency trees needed under isolated installs.
COPY --from=deps_prod /app/node_modules ./node_modules
COPY --from=deps_prod /app/apps/backend/node_modules ./apps/backend/node_modules
# Run from the backend workspace so Node resolves workspace-local deps under isolated installs
WORKDIR /app/apps/backend
# Copy package.json and built application
COPY --from=backend_builder /app/apps/backend/package.json ./package.json
COPY --from=backend_builder /app/apps/backend/dist ./dist
COPY --from=temporal_builder /app/apps/backend/dist ./dist
# Copy the infisical secret file
COPY ./.infisical.json ./.infisical.json

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Default port for the app (can be overridden by setting the PORT environment variable at runtime)
EXPOSE 3000

# Start the application with Node.js
CMD ["npm", "start"]
