import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { config } from './config'
import { findUidByPhone, disableWhatsApp, getDropStatus, registerDropViaBot, getAllUsersWithWA, verifyPhoneCode } from './firestore'
import {
  buildStopConfirmMessage, buildHelpMessage, buildDropStatusMessage,
  buildDropRegisteredMessage, buildAccountNotFoundMessage,
} from './messages'
import { getCurrentWeekId } from './checker'
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

    // Usa /data/session se existir (Railway Volume), senão fallback local
    const sessionDataPath = process.env.WHATSAPP_SESSION_PATH ?? config.whatsapp.sessionPath
    console.log(`[WA] Session path: ${sessionDataPath}`)

    client = new Client({
      authStrategy: new LocalAuth({ dataPath: sessionDataPath, clientId: 'lootflow' }),
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

    // Comandos via WhatsApp
    client.on('message', async (msg) => {
      // ignora mensagens de grupos
      if (msg.from.includes('@g.us')) return

      const phone = msg.from.replace('@c.us', '')
      const body = msg.body?.trim() ?? ''
      const upper = body.toUpperCase()

      console.log(`[WA] Mensagem de ${phone}: "${body}"`)

      // Código de verificação: 6 dígitos exatos — verifica antes de checar o uid
      if (/^\d{6}$/.test(body)) {
        const verifiedUid = await verifyPhoneCode(phone, body)
        if (verifiedUid) {
          await sendMessage(phone, `✅ *LootFlow* — Número verificado!\n\nBeleza, tá tudo certo. A partir de agora você vai receber os lembretes de drop aqui.\n\nManda *AJUDA* pra ver os comandos disponíveis.`)
          console.log(`[WA] ✅ Número ${phone} verificado para uid ${verifiedUid}`)
        } else {
          await sendMessage(phone, `❌ Código inválido ou expirado.\n\nGera um novo código lá no LootFlow → Configurações → Notificações WhatsApp.`)
        }
        return
      }

      const uid = await findUidByPhone(phone)
      if (!uid) return // número não cadastrado ou não verificado, ignora

      // PARAR
      if (upper === 'PARAR') {
        await disableWhatsApp(uid)
        await sendMessage(phone, buildStopConfirmMessage())
        return
      }

      // AJUDA / HELP
      if (upper === 'AJUDA' || upper === 'HELP' || upper === '?') {
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

      // DROP [conta] [valor] — registrar drop
      // ex: "drop akm 15.50" ou "drop servente de pedreiro 8"
      const dropMatch = body.match(/^drop\s+(.+?)\s+([\d,.]+)$/i)
      if (dropMatch) {
        const accountQuery = dropMatch[1].trim()
        const valueStr = dropMatch[2].replace(',', '.')
        const steamValue = parseFloat(valueStr)

        if (isNaN(steamValue) || steamValue <= 0) {
          await sendMessage(phone, `❌ Valor inválido: *${dropMatch[2]}*\nEx: _DROP AKM 15.50_`)
          return
        }

        const weekId = getCurrentWeekId()
        const result = await registerDropViaBot(uid, weekId, accountQuery, steamValue)

        if (!result) {
          // busca contas para mostrar lista
          const users = await getAllUsersWithWA()
          const userConf = users.find(u => u.uid === uid)
          const status = await getDropStatus(uid, weekId)
          const accountNames = status.map(a => a.name)
          await sendMessage(phone, buildAccountNotFoundMessage(accountQuery, accountNames))
          void userConf
          return
        }

        await sendMessage(phone, buildDropRegisteredMessage(result.accountName, result.dropNumber, steamValue))
        return
      }

      // Qualquer outra mensagem → mostra ajuda
      await sendMessage(phone, buildHelpMessage())

    })

    client.initialize()
  })
}
