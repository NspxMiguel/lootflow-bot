import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { config } from './config'
import { findUidByPhone, disableWhatsApp } from './firestore'
import { buildStopConfirmMessage } from './messages'
import { setCurrentQR, setBotConnected, setBotDisconnected } from './server'

let client: Client
let isReady = false

export function isClientReady(): boolean {
  return isReady
}

export async function sendMessage(phone: string, text: string): Promise<void> {
  if (!isReady) {
    console.warn(`[WA] Cliente não pronto — mensagem para ${phone} descartada`)
    return
  }
  try {
    await client.sendMessage(`${phone}@c.us`, text)
    console.log(`[WA] ✅ Mensagem enviada para ${phone}`)
  } catch (e) {
    console.error(`[WA] ❌ Falha ao enviar para ${phone}:`, e)
  }
}

export function initWhatsApp(): Promise<void> {
  return new Promise((resolve) => {
    // No Railway o Chromium fica em /usr/bin/chromium
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: config.whatsapp.sessionPath }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
      },
    })

    client.on('qr', (qr) => {
      // Mostra no terminal (local) E atualiza o endpoint HTTP (Railway)
      console.log('\n[WA] QR code disponível em /qr\n')
      qrcode.generate(qr, { small: true })
      setCurrentQR(qr)
    })

    client.on('ready', () => {
      isReady = true
      setBotConnected()
      const info = client.info
      console.log(`[WA] ✅ Conectado: ${info.pushname} (${info.wid.user})`)
      resolve()
    })

    client.on('disconnected', (reason) => {
      isReady = false
      setBotDisconnected()
      console.warn(`[WA] ⚠️ Desconectado: ${reason}`)
    })

    client.on('auth_failure', (msg) => {
      console.error('[WA] ❌ Falha de auth:', msg)
    })

    // Comando PARAR
    client.on('message', async (msg) => {
      if (msg.body?.trim().toUpperCase() !== 'PARAR') return
      const phone = msg.from.replace('@c.us', '')
      console.log(`[WA] PARAR recebido de ${phone}`)
      const uid = await findUidByPhone(phone)
      if (uid) {
        await disableWhatsApp(uid)
        await sendMessage(phone, buildStopConfirmMessage())
      }
    })

    client.initialize()
  })
}
