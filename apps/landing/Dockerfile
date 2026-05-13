# Dockerfile for @backspace/landing.
# Build context: the monorepo root (so pnpm sees pnpm-workspace.yaml).
# Configure on Railway: Builder = Dockerfile, Dockerfile Path =
# apps/landing/Dockerfile, Root Directory = repo root (unset).
FROM node:22-bookworm-slim

WORKDIR /app

# Pin pnpm via Corepack. The packageManager field in root package.json
# would normally do this, but Corepack-in-Railpack ignored it on this
# build host, so we activate explicitly here.
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Pull the entire workspace in one go. Slightly less cache-friendly than
# the staged "copy manifests, install, then copy source" pattern, but
# robust against the pnpm `workspace:*` protocol that needs every
# package's manifest visible at install time.
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @backspace/db generate
RUN pnpm --filter @backspace/landing build

ENV NODE_ENV=production

# The landing start script honors $PORT (set by Railway) and falls back
# to 3001 locally. Shell form so the env var expands.
CMD pnpm --filter @backspace/landing start
