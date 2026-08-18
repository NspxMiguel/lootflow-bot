FROM node:22-slim

# Instala Chromium e dependências necessárias para Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  libnss3 \
  libatk-bridge2.0-0 \
  libxss1 \
  libasound2 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Diz ao Puppeteer onde o Chromium está
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Limita heap do Node.js a 400 MB — sobra espaço para o Chromium
ENV NODE_OPTIONS="--max-old-space-size=400"

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

EXPOSE 3000

CMD ["node", "dist/index.js"]
