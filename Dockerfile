FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S contexta && adduser -S -G contexta contexta
COPY --from=build --chown=contexta:contexta /app/public ./public
COPY --from=build --chown=contexta:contexta /app/.next/standalone ./
COPY --from=build --chown=contexta:contexta /app/.next/static ./.next/static
USER contexta
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
