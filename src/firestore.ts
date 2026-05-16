import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
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

export interface WhatsAppSettings {
  phone: string
  enabled: boolean
  quietStart: string
  quietEnd: string
  remindDays: number[]
  encheSaco: boolean
  weeklySummary: boolean
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
  cashoutValue?: number
  steamValue: number
}

export interface UserNotifConfig {
  uid: string
  whatsapp: WhatsAppSettings
}

export interface PendingAccount {
  name: string
  dropsRegistered: number
}

export interface AccountSummary {
  name: string
  drops: number
  cashout: number
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

/** Lista todos os usuários que têm WhatsApp ativo e número configurado */
export async function getAllUsersWithWA(): Promise<UserNotifConfig[]> {
  const usersSnap = await db.collection('users').listDocuments()
  const result: UserNotifConfig[] = []

  await Promise.all(
    usersSnap.map(async (userRef) => {
      try {
        const settingsDoc = await userRef.collection('settings').doc('app').get()
        const settings = settingsDoc.data() as AppSettings | undefined
        const wa = settings?.whatsapp
        if (wa?.enabled && wa.phone?.length >= 12) {
          result.push({ uid: userRef.id, whatsapp: wa })
        }
      } catch (e) {
        console.error(`[Firestore] Erro ao ler uid ${userRef.id}:`, e)
      }
    }),
  )

  return result
}

/** Busca o uid pelo número de telefone */
export async function findUidByPhone(phone: string): Promise<string | null> {
  const users = await getAllUsersWithWA()
  return users.find(u => u.whatsapp.phone === phone)?.uid ?? null
}

/** Busca as configurações de WhatsApp de um usuário específico (independente de enabled) */
export async function getUserWASettings(uid: string): Promise<WhatsAppSettings | null> {
  try {
    const doc = await db.collection('users').doc(uid).collection('settings').doc('app').get()
    const wa = (doc.data() as AppSettings | undefined)?.whatsapp
    return (wa && wa.phone && wa.phone.length >= 12) ? wa : null
  } catch {
    return null
  }
}

/** Desativa WhatsApp de um usuário */
export async function disableWhatsApp(uid: string): Promise<void> {
  await db.collection('users').doc(uid).collection('settings').doc('app')
    .update({ 'whatsapp.enabled': false })
}

// ─── Drops & Contas ───────────────────────────────────────────────────────────

async function getActiveAccounts(uid: string): Promise<CSAccount[]> {
  const snap = await db.collection('users').doc(uid).collection('accounts').get()
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as CSAccount))
    .filter(a => a.active)
}

async function getDropsForWeek(uid: string, weekId: string): Promise<Drop[]> {
  const snap = await db.collection('users').doc(uid).collection('drops')
    .where('weekId', '==', weekId).get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Drop))
}

/** Contas que ainda têm drops a pegar esta semana */
export async function getPendingAccounts(uid: string, weekId: string): Promise<PendingAccount[]> {
  const [accounts, drops] = await Promise.all([
    getActiveAccounts(uid),
    getDropsForWeek(uid, weekId),
  ])
  return accounts
    .filter(a => drops.filter(d => d.accountId === a.id).length < 2)
    .map(a => ({
      name: a.name,
      dropsRegistered: drops.filter(d => d.accountId === a.id).length,
    }))
}

/** Resumo completo da semana para o usuário */
export async function getWeeklySummary(uid: string, weekId: string): Promise<{
  totalDrops: number
  totalCashout: number
  accountsSummary: AccountSummary[]
  pending: PendingAccount[]
}> {
  const [accounts, drops] = await Promise.all([
    getActiveAccounts(uid),
    getDropsForWeek(uid, weekId),
  ])

  const accountsSummary: AccountSummary[] = accounts.map(a => {
    const accDrops = drops.filter(d => d.accountId === a.id)
    const cashout = accDrops.reduce((sum, d) => sum + (d.cashoutValue ?? d.steamValue * 0.85), 0)
    return { name: a.name, drops: accDrops.length, cashout }
  })

  const pending = accounts
    .filter(a => drops.filter(d => d.accountId === a.id).length < 2)
    .map(a => ({
      name: a.name,
      dropsRegistered: drops.filter(d => d.accountId === a.id).length,
    }))

  return {
    totalDrops: drops.length,
    totalCashout: accountsSummary.reduce((s, a) => s + a.cashout, 0),
    accountsSummary,
    pending,
  }
}

// ─── Fila de notificações ─────────────────────────────────────────────────────

export interface QueuedNotification {
  docId: string
  uid: string
  type: string
  createdAt: string
}

/** Busca todas as notificações pendentes na fila de todos os usuários */
export async function drainNotificationQueue(): Promise<QueuedNotification[]> {
  const usersSnap = await db.collection('users').listDocuments()
  const result: QueuedNotification[] = []

  await Promise.all(
    usersSnap.map(async (userRef) => {
      try {
        const notifSnap = await userRef.collection('notifications').get()
        for (const doc of notifSnap.docs) {
          const data = doc.data()
          result.push({
            docId: doc.id,
            uid: userRef.id,
            type: data.type ?? 'unknown',
            createdAt: data.createdAt ?? '',
          })
          // Apaga imediatamente para não reprocessar
          await doc.ref.delete()
        }
      } catch {
        // ignora erros por usuário
      }
    }),
  )

  return result
}
