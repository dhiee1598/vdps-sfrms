FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/.output ./.output

COPY package*.json ./

RUN npm install --omit=dev && npm cache clean --force

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
