import { startServer } from './server'
import { initWhatsApp } from './whatsapp'
import { startScheduler } from './scheduler'
import fs from 'fs'

async function main() {
  // Garante que o diretório de sessão existe (Railway Volume pode estar vazio)
  const sessionPath = process.env.WHATSAPP_SESSION_PATH ?? '/data/session'
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true })
    console.log(`[Boot] Diretório de sessão criado: ${sessionPath}`)
  }
  console.log('╔══════════════════════════════╗')
  console.log('║      LootFlow WhatsApp Bot   ║')
  console.log('╚══════════════════════════════╝\n')

  // 1. Sobe o servidor HTTP (QR code + health check)
  const port = parseInt(process.env.PORT ?? '3000', 10)
  startServer(port)

  // 2. Conecta ao WhatsApp
  // No Railway: abra a URL do projeto + /qr para escanear o QR code
  console.log('[Boot] Inicializando WhatsApp...')
  console.log('[Boot] → Acesse a URL do Railway + /qr para escanear o QR code\n')
  await initWhatsApp()

  // 3. Sobe os crons
  startScheduler()

  console.log('\n[Boot] 🚀 Bot rodando!\n')
}

main().catch((e) => {
  console.error('[Boot] Erro fatal:', e)
  process.exit(1)
})
