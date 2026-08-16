FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm i --frozen-lockfile
COPY . ./
RUN pnpm run build


FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PORT=8080
ENV NITRO_HOST=0.0.0.0
COPY --from=build /app/.output/ ./
EXPOSE 8080
USER node
CMD ["node", "/app/server/index.mjs"]
