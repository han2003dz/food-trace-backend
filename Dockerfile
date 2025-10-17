FROM node:23-slim AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm i -g pnpm

RUN pnpm install

COPY . .

RUN npm run build

FROM node:23-slim

WORKDIR /app

COPY --from=builder /app/dist ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json