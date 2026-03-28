FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Production
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY server.js ./

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "server.js"]
