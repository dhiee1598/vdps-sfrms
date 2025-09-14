# -------- BUILD STAGE --------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# -------- PRODUCTION DEPS STAGE --------
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY --from=build /app/package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# -------- PRODUCTION STAGE --------
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/.output ./.output

COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000

CMD [".output/server/index.mjs"]
