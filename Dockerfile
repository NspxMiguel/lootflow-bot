FROM node:20-slim

# Instala Chromium e dependências necessárias para Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  libgbm-dev \
  libnss3 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libxss1 \
  libasound2 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Diz ao Puppeteer onde o Chromium está
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
