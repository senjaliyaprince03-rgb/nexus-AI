# ── Stage 1: base ─────────────────────────────────────────────────────────────
# Alpine keeps the image small (~130 MB vs ~400 MB on debian-slim).
# node:20-alpine is the LTS line used by Vercel's build environment.
FROM node:20-alpine AS base

# libc6-compat is required by some native Node addons on Alpine.
# curl is needed for the Docker healthcheck.
RUN apk add --no-cache libc6-compat curl

WORKDIR /app

# ── Stage 2: deps ──────────────────────────────────────────────────────────────
# Install node_modules in a dedicated stage so Docker can cache this layer.
# The cache is only invalidated when package-lock.json changes — not on every
# source-code edit. This makes rebuilds after code changes near-instant.
FROM base AS deps

# Copy lockfile + manifest only — not source code.
COPY package*.json ./

# npm ci fails if package-lock.json is missing or out of sync with package.json.
# Ensures reproducible installs across developer machines and CI.
RUN npm ci

# ── Stage 3: development ───────────────────────────────────────────────────────
# Used exclusively by docker-compose for local development.
# Source code is mounted as a volume so edits are reflected instantly
# without rebuilding the image — node_modules come from the deps stage.
FROM base AS development

# Copy pre-installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Don't COPY source here — docker-compose mounts ./frontend:/app at runtime.
# The volume mount overlays this directory, so source files come from the host.

ENV NODE_ENV=development \
    # Disable Next.js telemetry (opt-in only, never in CI/containers)
    NEXT_TELEMETRY_DISABLED=1 \
    # next dev listens on all interfaces inside the container
    HOSTNAME=0.0.0.0 \
    PORT=3000

EXPOSE 3000

# next dev starts the hot-reload dev server.
# Turbopack (--turbo) significantly speeds up incremental compilation.
CMD ["npx", "next", "dev", "--turbo"]

# ── Stage 4: builder ───────────────────────────────────────────────────────────
# Runs `next build` and produces the .next/standalone output.
# Keeping build separate from production means build tools never ship to prod.
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

# Copy all source files for the build.
COPY . .

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Build args for public env vars baked into the bundle at build time.
# Pass these with --build-arg in CI:  docker build --build-arg NEXT_PUBLIC_API_URL=...
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# next.config.ts must set `output: "standalone"` for the slim production image
# to work. Standalone mode copies only the files needed to run the server —
# the resulting image is ~80 MB vs ~600 MB with full node_modules.
RUN npm run build

# ── Stage 5: production ────────────────────────────────────────────────────────
# The final image. It receives only:
#   - The Node.js runtime (from base)
#   - .next/standalone  (the compiled server — ~5 MB of JS)
#   - .next/static       (hashed CSS/JS chunks for the browser)
#   - public/            (static assets: favicon, og-image, etc.)
#
# Everything else — node_modules, source code, build toolchain — is left behind
# in earlier stages and never included in the shipped image.
FROM base AS production

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# Run as a non-root user.
# Using numeric UID/GID (1001) is more portable than named users on Alpine.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone server bundle.
# Chown directly in the COPY to avoid a separate RUN chown layer.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# next start is not used here — standalone mode ships its own minimal server.js
# that starts faster and uses less memory than the full next CLI.
CMD ["node", "server.js"]
