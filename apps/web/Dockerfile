# Dockerfile for @backspace/web (the main social app).
# Build context: the monorepo root (so pnpm sees pnpm-workspace.yaml).
# Configure on Railway: Builder = Dockerfile, Dockerfile Path =
# apps/web/Dockerfile, Root Directory = repo root (unset).
FROM node:22-bookworm-slim

WORKDIR /app

# Pin pnpm via Corepack. The packageManager field in root package.json
# would normally do this, but Corepack-in-Railpack ignored it on the
# Railway build hosts we've seen, so we activate explicitly here.
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Pull the entire workspace in one go. Robust against pnpm's
# `workspace:*` protocol that needs every package's manifest visible
# at install time.
COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @backspace/db generate
RUN pnpm --filter @backspace/web build

ENV NODE_ENV=production

# next start reads PORT from env (set by Railway). Shell form so any
# env-var expansion in the start script works as expected.
CMD pnpm --filter @backspace/web start
