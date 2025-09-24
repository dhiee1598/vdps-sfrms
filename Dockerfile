# -------- BUILD STAGE --------
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# -------- PRODUCTION STAGE --------
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/.output/ ./

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]