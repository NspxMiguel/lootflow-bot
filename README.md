# lootflow-bot

Bot de WhatsApp para lembretes de drop semanal CS2, integrado ao LootFlow.

## Pré-requisitos

- Node.js 20+
- Oracle Cloud Free Tier (Ubuntu 22.04) ou qualquer VPS Linux
- Número de WhatsApp dedicado (para escanear o QR)
- Projeto Firebase com Admin SDK habilitado

## 1. Credenciais Firebase Admin

1. Acesse [Firebase Console](https://console.firebase.google.com) → seu projeto
2. **Project Settings** → **Service Accounts** → **Generate new private key**
3. Baixe o JSON — guarde-o com segurança (nunca commitar)

## 2. Setup no VPS

```bash
# Instalar dependências do sistema (Ubuntu 22.04)
sudo apt update && sudo apt install -y \
  nodejs npm git \
  chromium-browser \
  libgbm-dev libxshmfence-dev libatk-bridge2.0-0 \
  libgtk-3-0 libnss3 libxss1

# Instalar PM2 globalmente
sudo npm i -g pm2

# Clonar o repositório
git clone https://github.com/NspxMiguel/lootflow-bot
cd lootflow-bot

# Instalar dependências
npm install

# Copiar e preencher variáveis de ambiente
cp .env.example .env
nano .env
# → preencha FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
#   (copie os valores do JSON do Service Account)

# Compilar TypeScript
npm run build

# Primeiro start (vai mostrar QR code no terminal)
node dist/index.js
# → Escaneie o QR com o WhatsApp do número dedicado
# → Aguarde "✅ Conectado como: ..."
# → Ctrl+C para parar

# Subir com PM2 (permanente, sobrevive a reboot)
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # siga as instruções que aparecerem
```

## 3. Comandos úteis

```bash
pm2 status              # ver se está rodando
pm2 logs lootflow-bot   # ver logs em tempo real
pm2 restart lootflow-bot
pm2 stop lootflow-bot
```

## 4. Como funciona

1. Cada usuário do LootFlow cadastra seu número em **Configurações → Notificações WhatsApp**
2. O bot lê o Firestore e verifica quais usuários têm `whatsapp.enabled = true`
3. Nas terças (10h e 18h BRT), quartas (12h) e quintas (10h), verifica se há drops pendentes
4. Se houver, envia mensagem de lembrete no WhatsApp
5. O usuário pode responder **PARAR** para desativar os lembretes

## 5. Sessão expirada

Se o WhatsApp desconectar (raro), o bot vai logar um aviso.
Para reconectar:

```bash
pm2 stop lootflow-bot
rm -rf session/
node dist/index.js   # exibe QR → escaneie → Ctrl+C → pm2 start
pm2 start ecosystem.config.js
```

## 6. Atualizar o bot

```bash
git pull
npm install
npm run build
pm2 restart lootflow-bot
```
