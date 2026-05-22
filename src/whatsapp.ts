import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { config } from './config'
import { findUidByPhone, disableWhatsApp, getDropStatus, getAllUsersWithWA } from './firestore'
import {
  buildStopConfirmMessage, buildHelpMessage, buildUnknownCommandMessage,
  buildDropStatusMessage,
} from './messages'
import { getCurrentWeekId } from './checker'
import { setCurrentQR, setBotConnected, setBotDisconnected } from './server'

let client: Client
let isReady = false

// LID → real phone cache (WhatsApp privacy mode)
const lidToPhone = new Map<string, string>()

export function isClientReady(): boolean {
  return isReady
}

/** Resolve LID para phone real usando cache ou busca exaustiva */
async function resolveLid(lid: string): Promise<string | null> {
  // Cache hit
  if (lidToPhone.has(lid)) return lidToPhone.get(lid)!

  // Tenta obter o chat pelo phone de todos os usuários e ver se bate com o LID
  try {
    const users = await getAllUsersWithWA()
    for (const u of users) {
      try {
        const chat = await client.getChatById(`${u.whatsapp.phone}@c.us`)
        if (chat?.id?.server === 'lid' && chat.id.user === lid) {
          lidToPhone.set(lid, u.whatsapp.phone)
          console.log(`[WA] LID mapeado via chat: ${lid} → ${u.whatsapp.phone}`)
          return u.whatsapp.phone
        }
        // Testa se o contact tem um lid equivalente
        const contact = await client.getContactById(`${u.whatsapp.phone}@c.us`)
        const contactLid = (contact as any)?.id?.lid ?? (contact as any)?.lid
        if (contactLid && contactLid === lid) {
          lidToPhone.set(lid, u.whatsapp.phone)
          console.log(`[WA] LID mapeado via contact: ${lid} → ${u.whatsapp.phone}`)
          return u.whatsapp.phone
        }
      } catch {}
    }
  } catch {}
  return null
}

export async function sendMessage(phone: string, text: string): Promise<void> {
  if (!isReady) {
    console.warn(`[WA] Cliente não pronto — mensagem para ${phone} descartada`)
    return
  }
  try {
    await client.sendMessage(`${phone}@c.us`, text)
    console.log(`[WA] ✅ Mensagem enviada para ${phone}`)
    // Cache LID após send (se o chat usar @lid)
    try {
      const chat = await client.getChatById(`${phone}@c.us`)
      if (chat?.id?.server === 'lid') {
        lidToPhone.set(chat.id.user, phone)
        console.log(`[WA] LID cacheado no send: ${chat.id.user} → ${phone}`)
      }
    } catch {}
  } catch (e) {
    console.error(`[WA] ❌ Falha ao enviar para ${phone}:`, e)
  }
}

export function initWhatsApp(): Promise<void> {
  return new Promise((resolve) => {
    // No Railway o Chromium fica em /usr/bin/chromium
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined

    const sessionDataPath = process.env.WHATSAPP_SESSION_PATH ?? config.whatsapp.sessionPath
    console.log(`[WA] Session path: ${sessionDataPath}`)

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionDataPath }),
      puppeteer: {
        headless: true,
        executablePath,
        args: [
          // Segurança / sandbox (Railway não suporta)
          '--no-sandbox',
          '--disable-setuid-sandbox',

          // Memória
          '--disable-dev-shm-usage',        // usa /tmp em vez de /dev/shm (Railway tem /dev/shm pequeno)
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
          '--renderer-process-limit=1',

          // Desabilita features desnecessárias
          '--disable-extensions',
          '--disable-default-apps',
          '--disable-component-extensions-with-background-pages',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--disable-translate',
          '--no-first-run',
          '--no-default-browser-check',
          '--metrics-recording-only',
          '--mute-audio',
          '--hide-scrollbars',

          // Cache / disco
          '--aggressive-cache-discard',
          '--disable-cache',
          '--disable-application-cache',
          '--disk-cache-size=0',
          '--media-cache-size=0',

          // V8 heap limit dentro do Chromium
          '--js-flags=--max-old-space-size=128',
        ],
      },
    })

    client.on('qr', (qr) => {
      // Mostra no terminal (local) E atualiza o endpoint HTTP (Railway)
      console.log('\n[WA] QR code disponível em /qr\n')
      qrcode.generate(qr, { small: true })
      setCurrentQR(qr)
    })

    client.on('ready', async () => {
      isReady = true
      setBotConnected()
      const info = client.info
      console.log(`[WA] ✅ Conectado: ${info.pushname} (${info.wid.user})`)
      resolve()

      // Pré-popula cache LID → phone para todos os usuários cadastrados
      try {
        const users = await getAllUsersWithWA()
        for (const u of users) {
          try {
            const chat = await client.getChatById(`${u.whatsapp.phone}@c.us`)
            if (chat?.id?.server === 'lid') {
              lidToPhone.set(chat.id.user, u.whatsapp.phone)
              console.log(`[WA] LID pré-cacheado: ${chat.id.user} → ${u.whatsapp.phone}`)
            }
          } catch {}
        }
      } catch {}
    })

    client.on('disconnected', (reason) => {
      isReady = false
      setBotDisconnected()
      console.warn(`[WA] ⚠️ Desconectado: ${reason}`)
    })

    client.on('auth_failure', (msg) => {
      console.error('[WA] ❌ Falha de auth:', msg)
    })

    // Comandos via WhatsApp
    client.on('message', async (msg) => {
      // ignora mensagens de grupos
      if (msg.from.includes('@g.us')) return

      // Suporta @c.us (traditional) e @lid (WhatsApp Linked Device ID / privacy)
      let phone: string
      if (msg.from.includes('@lid')) {
        const lid = msg.from.replace('@lid', '')
        const resolved = await resolveLid(lid)
        if (resolved) {
          phone = resolved
          console.log(`[WA] @lid resolvido: ${lid} → ${phone}`)
        } else {
          console.warn(`[WA] @lid não resolvido: ${lid} — sem mapeamento disponível`)
          return
        }
      } else {
        phone = msg.from.replace('@c.us', '')
      }

      const body = msg.body?.trim() ?? ''
      const upper = body.toUpperCase()

      console.log(`[WA] Mensagem de ${phone}: "${body}"`)

      const uid = await findUidByPhone(phone)
      if (!uid) {
        console.warn(`[WA] UID não encontrado para phone: "${phone}" — número não cadastrado ou não verificado`)
        return
      }

      // PARAR
      if (upper === 'PARAR') {
        await disableWhatsApp(uid)
        await sendMessage(phone, buildStopConfirmMessage())
        return
      }

      // AJUDA / HELP / /HELP
      if (upper === 'AJUDA' || upper === 'HELP' || upper === '/HELP' || upper === '?') {
        await sendMessage(phone, buildHelpMessage())
        return
      }

      // STATUS — ver drops da semana
      if (upper === 'STATUS' || upper === 'DROPS') {
        const weekId = getCurrentWeekId()
        const status = await getDropStatus(uid, weekId)
        await sendMessage(phone, buildDropStatusMessage(status))
        return
      }

      // Qualquer outra mensagem → eco + lista de comandos
      await sendMessage(phone, buildUnknownCommandMessage(body))

    })

    client.initialize()
  })
}
