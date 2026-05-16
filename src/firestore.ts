import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { config } from './config'

// ─── Init ────────────────────────────────────────────────────────────────────

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
  })
}

const db = getFirestore()

// ─── Types (espelham o frontend) ─────────────────────────────────────────────

interface WhatsAppSettings {
  phone: string
  enabled: boolean
  quietStart: string  // "HH:MM"
  quietEnd: string    // "HH:MM"
  remindDays: number[]
}

interface AppSettings {
  whatsapp?: WhatsAppSettings
}

interface CSAccount {
  id: string
  name: string
  active: boolean
}

interface Drop {
  id: string
  accountId: string
  weekId: string
  dropNumber: number
}

export interface UserNotifConfig {
  uid: string
  whatsapp: WhatsAppSettings
}

export interface PendingAccount {
  name: string
  dropsRegistered: number  // 0, 1 ou 2
}

// ─── Funções ─────────────────────────────────────────────────────────────────

/** Lista todos os usuários que têm WhatsApp ativo e número configurado */
export async function getAllUsersWithWA(): Promise<UserNotifConfig[]> {
  const usersSnap = await db.collection('users').listDocuments()
  const result: UserNotifConfig[] = []

  await Promise.all(
    usersSnap.map(async (userRef) => {
      try {
        const settingsDoc = await userRef
          .collection('settings')
          .doc('app')
          .get()

        const settings = settingsDoc.data() as AppSettings | undefined
        const wa = settings?.whatsapp
        if (wa?.enabled && wa.phone?.length >= 10) {
          result.push({ uid: userRef.id, whatsapp: wa })
        }
      } catch (e) {
        console.error(`Erro ao ler settings do uid ${userRef.id}:`, e)
      }
    }),
  )

  return result
}

/** Retorna contas ativas do usuário */
async function getActiveAccounts(uid: string): Promise<CSAccount[]> {
  const snap = await db.collection('users').doc(uid).collection('accounts').get()
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as CSAccount))
    .filter(a => a.active)
}

/** Retorna drops da semana atual do usuário */
async function getDropsThisWeek(uid: string, weekId: string): Promise<Drop[]> {
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('drops')
    .where('weekId', '==', weekId)
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Drop))
}

/** Retorna as contas que ainda têm drops a pegar esta semana */
export async function getPendingAccounts(
  uid: string,
  weekId: string,
): Promise<PendingAccount[]> {
  const [accounts, drops] = await Promise.all([
    getActiveAccounts(uid),
    getDropsThisWeek(uid, weekId),
  ])

  const pending: PendingAccount[] = []
  for (const acc of accounts) {
    const registered = drops.filter(d => d.accountId === acc.id).length
    if (registered < 2) {
      pending.push({ name: acc.name, dropsRegistered: registered })
    }
  }
  return pending
}

/** Desativa notificações WhatsApp de um usuário (comando PARAR) */
export async function disableWhatsApp(uid: string): Promise<void> {
  await db
    .collection('users')
    .doc(uid)
    .collection('settings')
    .doc('app')
    .update({ 'whatsapp.enabled': false })
}

/**
 * Busca o uid pelo número de telefone (para processar "PARAR").
 * Varre todos os usuários — ok para volumes pequenos.
 */
export async function findUidByPhone(phone: string): Promise<string | null> {
  const users = await getAllUsersWithWA()
  const match = users.find(u => u.whatsapp.phone === phone)
  return match?.uid ?? null
}
