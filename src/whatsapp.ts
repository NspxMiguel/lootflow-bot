import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { config } from './config'
import { findUidByPhone, disableWhatsApp, getDropStatus, registerDropViaBot, getAllUsersWithWA } from './firestore'
import {
  buildStopConfirmMessage, buildHelpMessage, buildUnknownCommandMessage,
  buildDropStatusMessage, buildDropRegisteredMessage, buildAccountNotFoundMessage,
  buildDropConfirmMessage, buildDropCancelledMessage, buildSteamNotFoundMessage,
} from './messages'
import { getCurrentWeekId } from './checker'
import { setCurrentQR, setBotConnected, setBotDisconnected } from './server'
import { fetchSteamPrice } from './steam'

// ─── Pending drop confirmations ───────────────────────────────────────────────

interface PendingDrop {
  uid: string
  phone: string
  accountQuery: string
  itemName: string
  steamValue: number
  expiresAt: number  // unix ms — auto-cancel after 5 min
}

const pendingDrops = new Map<string, PendingDrop>()  // key = phone

function setPending(phone: string, data: Omit<PendingDrop, 'expiresAt'>) {
  pendingDrops.set(phone, { ...data, expiresAt: Date.now() + 5 * 60 * 1000 })
}

function getPending(phone: string): PendingDrop | null {
  const p = pendingDrops.get(phone)
  if (!p) return null
  if (Date.now() > p.expiresAt) {
    pendingDrops.delete(phone)
    return null
  }
  return p
}

function clearPending(phone: string) {
  pendingDrops.delete(phone)
}

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

    // Comandos via WhatsApp
    client.on('message', async (msg) => {
      // ignora mensagens de grupos
      if (msg.from.includes('@g.us')) return

      // Suporta @c.us (traditional) e @lid (WhatsApp Linked Device ID / privacy)
      let phone: string
      if (msg.from.includes('@lid')) {
        try {
          const contact = await msg.getContact()
          phone = contact.number
          console.log(`[WA] @lid resolvido: ${msg.from} → ${phone}`)
        } catch {
          phone = msg.from.replace('@lid', '').replace('@c.us', '')
          console.warn(`[WA] Falha ao resolver @lid, usando fallback: ${phone}`)
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
        clearPending(phone)
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

      // SIM / NÃO — confirma ou cancela drop pendente
      if (upper === 'SIM' || upper === 'S') {
        const pending = getPending(phone)
        if (!pending) {
          await sendMessage(phone, `❓ Não há drop aguardando confirmação.\n\nUse _DROP [conta] [item]_ para registrar.`)
          return
        }
        clearPending(phone)
        const weekId = getCurrentWeekId()
        const result = await registerDropViaBot(uid, weekId, pending.accountQuery, pending.steamValue)
        if (!result) {
          const status = await getDropStatus(uid, weekId)
          const accountNames = status.map(a => a.name)
          await sendMessage(phone, buildAccountNotFoundMessage(pending.accountQuery, accountNames))
          return
        }
        await sendMessage(phone, buildDropRegisteredMessage(result.accountName, result.dropNumber, pending.steamValue))
        return
      }

      if (upper === 'NÃO' || upper === 'NAO' || upper === 'N') {
        const had = getPending(phone)
        clearPending(phone)
        if (had) {
          await sendMessage(phone, buildDropCancelledMessage())
        } else {
          await sendMessage(phone, buildUnknownCommandMessage(body))
        }
        return
      }

      // DROP [conta] [valor numérico] — ex: "drop akm 15.50"
      const dropWithValue = body.match(/^drop\s+(.+?)\s+([\d,.]+)$/i)
      if (dropWithValue) {
        const accountQuery = dropWithValue[1].trim()
        const valueStr = dropWithValue[2].replace(',', '.')
        const steamValue = parseFloat(valueStr)

        if (isNaN(steamValue) || steamValue <= 0) {
          await sendMessage(phone, `❌ Valor inválido: *${dropWithValue[2]}*\nEx: _DROP AKM 15.50_`)
          return
        }

        const weekId = getCurrentWeekId()
        const result = await registerDropViaBot(uid, weekId, accountQuery, steamValue)

        if (!result) {
          const status = await getDropStatus(uid, weekId)
          const accountNames = status.map(a => a.name)
          await sendMessage(phone, buildAccountNotFoundMessage(accountQuery, accountNames))
          return
        }

        await sendMessage(phone, buildDropRegisteredMessage(result.accountName, result.dropNumber, steamValue))
        return
      }

      // DROP [conta] [nome do item] — busca preço automático no Steam
      // ex: "drop akm Operation Bravo Case" ou "drop servente de pedreiro Falchion Case"
      const dropWithItem = body.match(/^drop\s+(.+?)\s{2,}(.+)$/i)
        ?? body.match(/^drop\s+(\S+)\s+(.{4,})$/i)   // fallback: 1 word account + item ≥4 chars
      if (dropWithItem) {
        const accountQuery = dropWithItem[1].trim()
        const itemQuery = dropWithItem[2].trim()

        // evita fazer fetch se "item" parece um número (já foi pego pelo dropWithValue acima)
        if (/^[\d,.]+$/.test(itemQuery)) {
          await sendMessage(phone, `❌ Valor inválido.\nEx: _DROP AKM 15.50_`)
          return
        }

        await sendMessage(phone, `🔍 Buscando *"${itemQuery}"* no Steam Market…`)

        const steamResult = await fetchSteamPrice(itemQuery)
        if (!steamResult || steamResult.price === null) {
          await sendMessage(phone, buildSteamNotFoundMessage(itemQuery))
          return
        }

        // guarda pending aguardando SIM/NÃO
        setPending(phone, {
          uid,
          phone,
          accountQuery,
          itemName: steamResult.name,
          steamValue: steamResult.price,
        })

        await sendMessage(phone, buildDropConfirmMessage(accountQuery, steamResult.name, steamResult.price))
        return
      }

      // Qualquer outra mensagem → eco + lista de comandos
      await sendMessage(phone, buildUnknownCommandMessage(body))

    })

    client.initialize()
  })
}
