# -------- BUILD STAGE --------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# -------- DEPS STAGE (production deps only) --------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# -------- PRODUCTION STAGE --------
FROM gcr.io/distroless/nodejs22-debian12 AS production

WORKDIR /app

COPY --from=build /app/.output ./.output

COPY --from=deps /app/node_modules ./node_modules

COPY package*.json ./

EXPOSE 3000

CMD [".output/server/index.mjs"]
