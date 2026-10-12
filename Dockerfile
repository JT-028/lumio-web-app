# Lumio listens on 3010. package.json start is `next start --port 3010`, not 3000.
# Supabase stays outside this image. Build context must not include .env.

FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.ts next-env.d.ts tsconfig.json ./
COPY src ./src
# NEXT_PUBLIC_* is inlined by `next build`. Empty args leave the app unconfigured.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3010 \
    HOME=/tmp
RUN groupadd --system --gid 1001 lumio \
    && useradd --system --uid 1001 --gid lumio --home-dir /tmp --no-create-home --shell /usr/sbin/nologin lumio \
    && chown lumio:lumio /app
COPY --from=build --chown=lumio:lumio /app/package.json ./package.json
COPY --from=build --chown=lumio:lumio /app/node_modules ./node_modules
COPY --from=build --chown=lumio:lumio /app/.next ./.next
COPY --from=build --chown=lumio:lumio /app/next.config.ts ./next.config.ts
COPY --from=build --chown=lumio:lumio /app/tsconfig.json ./tsconfig.json
USER lumio
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3010/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
