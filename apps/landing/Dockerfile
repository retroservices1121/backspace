# Dockerfile for @backspace/landing.
# Build context: the monorepo root (so pnpm sees pnpm-workspace.yaml).
# Configure on Railway: Builder = Dockerfile, Dockerfile Path =
# apps/landing/Dockerfile, Root Directory = repo root (unset).
FROM node:22-bookworm-slim

WORKDIR /app

# bookworm-slim strips most libs. Prisma's query engine binary needs
# libssl at runtime — without this the container boots, then 500s
# every request with PrismaClientInitializationError "libssl.so.3:
# cannot open shared object file". ca-certificates is required for
# outbound HTTPS to npm + Resend + Polymarket.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Pin pnpm via Corepack. The packageManager field in root package.json
# would normally do this, but Corepack-in-Railpack ignored it on this
# build host, so we activate explicitly here.
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Pull the entire workspace in one go. Slightly less cache-friendly than
# the staged "copy manifests, install, then copy source" pattern, but
# robust against the pnpm `workspace:*` protocol that needs every
# package's manifest visible at install time.
COPY . .

# Only install what the landing app actually needs — @backspace/landing
# plus its workspace dependencies (@backspace/db, @backspace/usernames)
# plus their npm deps. Skips firebase/stripe/etc from apps/web, which
# saves ~80% install time and shrinks the network surface area that
# would otherwise occasionally trip on transient npm-registry hiccups.
RUN pnpm install --frozen-lockfile --filter @backspace/landing...
RUN pnpm --filter @backspace/db generate
RUN pnpm --filter @backspace/landing build

ENV NODE_ENV=production

# The landing start script honors $PORT (set by Railway) and falls back
# to 3001 locally. Shell form so the env var expands.
CMD pnpm --filter @backspace/landing start
