# Build Stage 1

FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

# Copy package.json and your lockfile, here we add pnpm-lock.yaml for illustration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# Install dependencies
RUN pnpm i --frozen-lockfile

# Copy the entire project
COPY . ./

# Build the project
RUN pnpm run build

# Build Stage 2

FROM node:22-alpine AS runtime
WORKDIR /app

# Change the port and host
ENV NODE_ENV=production
ENV NITRO_PORT=80
ENV NITRO_HOST=0.0.0.0

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output/ ./

EXPOSE 80

USER node

CMD ["node", "/app/server/index.mjs"]
