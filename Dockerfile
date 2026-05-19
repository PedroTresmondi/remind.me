FROM node:20-alpine

WORKDIR /app

COPY api/package.json api/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY api/src ./src

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]
