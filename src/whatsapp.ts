import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { config } from './config'
import { findUidByPhone, disableWhatsApp } from './firestore'
import { buildStopConfirmMessage } from './messages'

let client: Client
let isReady = false

export function getClient(): Client {
  return client
}

export function isClientReady(): boolean {
  return isReady
}

export async function sendMessage(phone: string, text: string): Promise<void> {
  if (!isReady) {
    console.warn(`[WA] Cliente não pronto — mensagem para ${phone} descartada`)
    return
  }
  try {
    // WhatsApp espera o número no formato "55XXXXXXXXXXX@c.us"
    const chatId = `${phone}@c.us`
    await client.sendMessage(chatId, text)
    console.log(`[WA] ✅ Mensagem enviada para ${phone}`)
  } catch (e) {
    console.error(`[WA] ❌ Falha ao enviar para ${phone}:`, e)
  }
}

export function initWhatsApp(): Promise<void> {
  return new Promise((resolve) => {
    client = new Client({
      authStrategy: new LocalAuth({ dataPath: config.whatsapp.sessionPath }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      },
    })

    client.on('qr', (qr) => {
      console.log('\n[WA] Escaneie o QR code abaixo com o número dedicado:\n')
      qrcode.generate(qr, { small: true })
    })

    client.on('ready', () => {
      isReady = true
      const info = client.info
      console.log(`[WA] ✅ Conectado como: ${info.pushname} (${info.wid.user})`)
      resolve()
    })

    client.on('disconnected', (reason) => {
      isReady = false
      console.warn(`[WA] ⚠️ Desconectado: ${reason}`)
    })

    client.on('auth_failure', (msg) => {
      console.error('[WA] ❌ Falha de autenticação:', msg)
    })

    // Escuta "PARAR" para desativar notificações do usuário
    client.on('message', async (msg) => {
      const text = msg.body?.trim().toUpperCase()
      if (text !== 'PARAR') return

      const phone = msg.from.replace('@c.us', '')
      console.log(`[WA] Comando PARAR recebido de ${phone}`)

      const uid = await findUidByPhone(phone)
      if (uid) {
        await disableWhatsApp(uid)
        await sendMessage(phone, buildStopConfirmMessage())
        console.log(`[WA] Notificações desativadas para uid ${uid}`)
      }
    })

    client.initialize()
  })
}
