# syntax=docker/dockerfile:1.4
#
# Bun image for the nameserver-json-api (the HTTP DNS-over-JSON record source
# CoreDNS forwards to). Modeled on apps/backend/Dockerfile but Bun-only: it
# runs TypeScript directly (no tsdown build) and disables Bun's on-disk
# transpiler cache so it stays writeless under `readOnlyRootFilesystem: true`.
#
#   DOCKER_BUILDKIT=1 docker build -t namefi-ns-json-api -f apps/ns-json-api/Dockerfile .
#
ARG BASE_PRUNER=node:jod-bullseye-slim
ARG BUN_IMAGE=oven/bun:1.3.12-slim

# ##############################################################################
# Stage 1: Prune the monorepo to only the ns-json-api dependency closure.
# ##############################################################################
FROM ${BASE_PRUNER} AS pruner
WORKDIR /app
ARG BASE_PRUNER=node:jod-bullseye-slim
RUN if [ "$BASE_PRUNER" = "node:jod-bullseye-slim" ]; then \
        npm install -g turbo@2.9.5; \
    else \
        echo "USING CACHED IMAGE"; \
    fi
COPY . .
RUN turbo prune @namefi-astra/ns-json-api --docker

# ##############################################################################
# Stage 2: Install production dependencies with Bun, then overlay the source.
# (No coredns-client copy: ns-json-api does not depend on it.)
# ##############################################################################
FROM ${BUN_IMAGE} AS deps
ENV CI="true"
WORKDIR /app
# Pruned lockfile + package manifests emitted by Turbo.
COPY --from=pruner /app/out/json/ .
# Bun runs the root `prepare` lifecycle during install, so the script must
# exist (it no-ops under CI=true). bunfig.toml carries linker="isolated".
COPY ./scripts/prepare.sh ./scripts/prepare.sh
COPY ./bunfig.toml ./
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --lockfile-only --ignore-scripts
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache bun install --frozen-lockfile --production
# Overlay the pruned source onto the installed dependency tree. The app runs
# TypeScript directly, so the workspace package sources must be present.
COPY --from=pruner /app/out/full/ ./

# ##############################################################################
# Stage 3: Runtime image (non-root, read-only-rootfs friendly).
# ##############################################################################
FROM ${BUN_IMAGE} AS runner
ENV NODE_ENV=production
ENV ENVIRONMENT=production
ENV CI="true"
# Disable Bun's on-disk transpiler cache so running .ts writes nothing —
# required under the pod's readOnlyRootFilesystem: true.
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
WORKDIR /app
COPY --from=deps /app ./
COPY ./.infisical.json ./.infisical.json
WORKDIR /app/apps/ns-json-api
# oven/bun ships a non-root `bun` user (uid 1000) -> satisfies runAsNonRoot.
USER bun
# :8080 HTTP JSON API (CoreDNS upstream); /flush-cache is a route on the same app.
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
