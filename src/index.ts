import { initWhatsApp } from './whatsapp'
import { startScheduler } from './scheduler'

async function main() {
  console.log('╔══════════════════════════════╗')
  console.log('║      LootFlow WhatsApp Bot   ║')
  console.log('╚══════════════════════════════╝\n')

  // 1. Conecta ao WhatsApp (pode mostrar QR code na primeira vez)
  console.log('[Boot] Inicializando WhatsApp...')
  await initWhatsApp()

  // 2. Sobe os crons de lembrete
  startScheduler()

  console.log('\n[Boot] 🚀 Bot rodando. Ctrl+C para parar.\n')
}

main().catch((e) => {
  console.error('[Boot] Erro fatal:', e)
  process.exit(1)
})
