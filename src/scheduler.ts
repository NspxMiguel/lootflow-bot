import cron from 'node-cron'
import { getAllUsersWithWA, getPendingAccounts } from './firestore'
import { getCurrentWeekId, isInQuietHours } from './checker'
import { buildReminderMessage } from './messages'
import { sendMessage, isClientReady } from './whatsapp'
import { config } from './config'

/**
 * Verifica todos os usuários com WA ativo e envia lembretes
 * para os que ainda têm drops pendentes nessa semana.
 */
async function runNotifications(attempt: number): Promise<void> {
  if (!isClientReady()) {
    console.log('[Scheduler] WhatsApp não pronto, pulando rodada.')
    return
  }

  console.log(`\n[Scheduler] 🔍 Rodada ${attempt} — ${new Date().toISOString()}`)
  const weekId = getCurrentWeekId()
  const users = await getAllUsersWithWA()
  console.log(`[Scheduler] ${users.length} usuário(s) com WhatsApp ativo`)

  for (const { uid, whatsapp } of users) {
    try {
      // Verifica quiet hours
      if (isInQuietHours(whatsapp.quietStart, whatsapp.quietEnd, config.tzOffset)) {
        console.log(`[Scheduler] ⏸ uid ${uid} — dentro do horário de silêncio`)
        continue
      }

      // Verifica dia da semana (remindDays do usuário)
      const todayDay = new Date().getDay()
      if (!whatsapp.remindDays.includes(todayDay)) {
        console.log(`[Scheduler] ⏭ uid ${uid} — hoje não é dia de lembrete`)
        continue
      }

      const pending = await getPendingAccounts(uid, weekId)
      if (pending.length === 0) {
        console.log(`[Scheduler] ✅ uid ${uid} — todos os drops registrados`)
        continue
      }

      const msg = buildReminderMessage(pending, attempt)
      await sendMessage(whatsapp.phone, msg)
    } catch (e) {
      console.error(`[Scheduler] ❌ Erro ao processar uid ${uid}:`, e)
    }
  }
}

export function startScheduler(): void {
  // Cron usa UTC — BRT = UTC-3, então:
  // 10:00 BRT = 13:00 UTC → "0 13 * * *"
  // 18:00 BRT = 21:00 UTC → "0 21 * * *"
  // 12:00 BRT = 15:00 UTC → "0 15 * * *"
  //
  // Tentativa 1: toda terça 10h BRT (CS2 reseta terça)
  cron.schedule('0 13 * * 2', () => runNotifications(1), { timezone: 'UTC' })

  // Tentativa 2: toda terça 18h BRT (follow-up)
  cron.schedule('0 21 * * 2', () => runNotifications(2), { timezone: 'UTC' })

  // Tentativa 3: toda quarta 12h BRT
  cron.schedule('0 15 * * 3', () => runNotifications(3), { timezone: 'UTC' })

  // Tentativa 4: toda quinta 10h BRT
  cron.schedule('0 13 * * 4', () => runNotifications(3), { timezone: 'UTC' })

  console.log('[Scheduler] ✅ Crons registrados:')
  console.log('  → Terça  10h BRT (1ª tentativa)')
  console.log('  → Terça  18h BRT (2ª tentativa)')
  console.log('  → Quarta 12h BRT (3ª tentativa)')
  console.log('  → Quinta 10h BRT (4ª tentativa)')
}
