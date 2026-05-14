# Dockerfile for @backspace/web (the main social app).
# Build context: the monorepo root (so pnpm sees pnpm-workspace.yaml).
# Configure on Railway: Builder = Dockerfile, Dockerfile Path =
# apps/web/Dockerfile, Root Directory = repo root (unset).
FROM node:22-bookworm-slim

WORKDIR /app

# bookworm-slim strips most libs. Prisma's query engine binary needs
# libssl at runtime — without this the container boots, then 500s
# every DB-touching request with PrismaClientInitializationError
# "libssl.so.3: cannot open shared object file". ca-certificates is
# required for outbound HTTPS (Privy, Stripe, R2, Polymarket).
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl libssl3 ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Pin pnpm via Corepack. The packageManager field in root package.json
# would normally do this, but Corepack-in-Railpack ignored it on the
# Railway build hosts we've seen, so we activate explicitly here.
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Pull the entire workspace in one go. Robust against pnpm's
# `workspace:*` protocol that needs every package's manifest visible
# at install time.
COPY . .

# Scope the install to @backspace/web and its workspace + npm deps.
# Skips landing-only deps like resend, and avoids reinstalling deps for
# apps/admin or apps/mobile that this service does not run.
RUN pnpm install --frozen-lockfile --filter @backspace/web...

# Next 12's verifyTypeScriptSetup pre-flight calls require.resolve(
# '@types/react/index.d.ts'), which modern @types/react (17.0.83+)
# blocks via an `exports` map. The check runs before
# typescript.ignoreBuildErrors can suppress it, and fails the build
# with the misleading "Please install @types/react" message even when
# @types/react is fully installed. Strip the exports field as a
# post-install fixup. See script header for full background.
RUN node apps/web/scripts/fix-types-react-exports.cjs

RUN pnpm --filter @backspace/db generate

# NEXT_PUBLIC_* vars are inlined into the client bundle at `next build`
# time, reading from the build process environment. Railway exposes
# service variables to a Dockerfile build only when declared as ARG, so
# without these the bundle bakes `undefined` — PrivyProvider never
# mounts, usePrivy() stays ready:false, and the app hangs on the
# loading spinner. Promote each ARG to ENV so `next build` sees it.
ARG NEXT_PUBLIC_PRIVY_APP_ID
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_DATABASE_URL
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_PRIVY_APP_ID=$NEXT_PUBLIC_PRIVY_APP_ID \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY \
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
    NEXT_PUBLIC_FIREBASE_DATABASE_URL=$NEXT_PUBLIC_FIREBASE_DATABASE_URL \
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID \
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
    NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

RUN pnpm --filter @backspace/web build

ENV NODE_ENV=production

# next start reads PORT from env (set by Railway). Shell form so any
# env-var expansion in the start script works as expected.
CMD pnpm --filter @backspace/web start
