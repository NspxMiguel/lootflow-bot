import cron from 'node-cron'
import {
  getAllUsersWithWA, getPendingAccounts, getWeeklySummary, drainNotificationQueue,
  getUserWASettings,
} from './firestore'
import { getCurrentWeekId, isInQuietHours } from './checker'
import {
  buildReminderMessage, buildWeeklySummaryMessage, buildTestMessage,
} from './messages'
import { sendMessage, isClientReady } from './whatsapp'
import { config } from './config'

// ─── Processador da fila de notificações (roda a cada minuto) ─────────────────

async function processQueue(): Promise<void> {
  if (!isClientReady()) return

  const items = await drainNotificationQueue()
  if (items.length === 0) return

  console.log(`[Queue] ${items.length} notificação(ões) pendente(s)`)

  for (const item of items) {
    try {
      if (item.type === 'test' || item.type === 'force_reminder') {
        // test / force_reminder: sem exigir enabled=true, sem checar dia/horário
        const wa = await getUserWASettings(item.uid)
        if (!wa) {
          console.warn(`[Queue] ⚠️ ${item.type} ignorado — uid ${item.uid} sem número`)
          continue
        }
        if (item.type === 'test') {
          await sendMessage(wa.phone, buildTestMessage())
          console.log(`[Queue] ✅ Teste enviado para uid ${item.uid} (${wa.phone})`)
        } else {
          // force_reminder: mostra lembrete real com drops pendentes
          const weekId = getCurrentWeekId()
          const pending = await getPendingAccounts(item.uid, weekId)
          if (pending.length === 0) {
            await sendMessage(wa.phone, `🎮 *LootFlow* — Simulação de lembrete\n\n✅ Nenhum drop pendente esta semana! Tudo registrado.`)
          } else {
            await sendMessage(wa.phone, buildReminderMessage(pending, 1, wa.encheSaco ?? false))
          }
          console.log(`[Queue] ✅ Lembrete forçado para uid ${item.uid} (${wa.phone})`)
        }

      } else {
        // Outros tipos: requer whatsapp.enabled = true
        const users = await getAllUsersWithWA()
        const userConfig = users.find(u => u.uid === item.uid)
        if (!userConfig) continue

        const { phone, encheSaco } = userConfig.whatsapp

        if (item.type === 'weekly_summary') {
          const weekId = getCurrentWeekId()
          const summary = await getWeeklySummary(item.uid, weekId)
          await sendMessage(phone, buildWeeklySummaryMessage(summary))
          console.log(`[Queue] ✅ Resumo semanal para uid ${item.uid}`)

        } else if (item.type === 'drop_registered') {
          const weekId = getCurrentWeekId()
          const summary = await getWeeklySummary(item.uid, weekId)
          const allDone = summary.pending.length === 0
          const msg = allDone
            ? `🎮 *LootFlow* — Drop registrado!\n\n✅ Todos os drops dessa semana foram registrados.\n💰 Cashout total: *R$ ${summary.totalCashout.toFixed(2)}*\n\n💪 Semana boa! Continue farmando.`
            : `🎮 *LootFlow* — Drop registrado!\n\n📊 Progresso: ${summary.totalDrops} drops | R$ ${summary.totalCashout.toFixed(2)}\n⚠️ Ainda faltam: ${summary.pending.map(p => p.name).join(', ')}`
          await sendMessage(phone, msg)
        }

        void encheSaco // suprime unused warning
      }
    } catch (e) {
      console.error(`[Queue] ❌ Erro ao processar notificação ${item.docId}:`, e)
    }
  }
}

// ─── Lembretes periódicos ─────────────────────────────────────────────────────

async function runReminders(attempt: number): Promise<void> {
  if (!isClientReady()) {
    console.log('[Scheduler] WhatsApp não pronto, pulando.')
    return
  }

  console.log(`\n[Scheduler] 🔍 Lembrete tentativa ${attempt} — ${new Date().toISOString()}`)
  const weekId = getCurrentWeekId()
  const users = await getAllUsersWithWA()
  console.log(`[Scheduler] ${users.length} usuário(s) com WhatsApp ativo`)

  for (const { uid, whatsapp } of users) {
    try {
      if (isInQuietHours(whatsapp.quietStart, whatsapp.quietEnd, config.tzOffset)) {
        console.log(`[Scheduler] ⏸ uid ${uid} — horário de silêncio`)
        continue
      }

      const todayDay = new Date().getDay()
      if (!whatsapp.remindDays.includes(todayDay)) {
        console.log(`[Scheduler] ⏭ uid ${uid} — não é dia de lembrete`)
        continue
      }

      const pending = await getPendingAccounts(uid, weekId)
      if (pending.length === 0) {
        console.log(`[Scheduler] ✅ uid ${uid} — tudo registrado`)
        continue
      }

      const msg = buildReminderMessage(pending, attempt, whatsapp.encheSaco ?? false)
      await sendMessage(whatsapp.phone, msg)
    } catch (e) {
      console.error(`[Scheduler] ❌ uid ${uid}:`, e)
    }
  }
}

// ─── Resumo semanal (terça cedo) ──────────────────────────────────────────────

async function runWeeklySummaries(): Promise<void> {
  if (!isClientReady()) return

  console.log('\n[Scheduler] 📊 Enviando resumos semanais...')
  const weekId = getCurrentWeekId()
  const users = await getAllUsersWithWA()

  for (const { uid, whatsapp } of users) {
    if (!whatsapp.weeklySummary) continue
    try {
      const summary = await getWeeklySummary(uid, weekId)
      // Só envia resumo se tiver ao menos 1 drop registrado
      if (summary.totalDrops === 0) continue
      await sendMessage(whatsapp.phone, buildWeeklySummaryMessage(summary))
      console.log(`[Scheduler] ✅ Resumo semanal para uid ${uid}`)
    } catch (e) {
      console.error(`[Scheduler] ❌ Resumo para uid ${uid}:`, e)
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function startScheduler(): void {
  // Verifica fila de notificações a cada minuto
  cron.schedule('* * * * *', () => processQueue(), { timezone: 'UTC' })

  // Resumo semanal: terça 08h BRT = 11h UTC
  cron.schedule('0 11 * * 2', () => runWeeklySummaries(), { timezone: 'UTC' })

  // Lembretes de drop:
  // Terça  10h BRT = 13h UTC (1ª tentativa — drops acabaram de resetar)
  cron.schedule('0 13 * * 2', () => runReminders(1), { timezone: 'UTC' })
  // Terça  18h BRT = 21h UTC (2ª — ainda tem tempo)
  cron.schedule('0 21 * * 2', () => runReminders(2), { timezone: 'UTC' })
  // Quarta 12h BRT = 15h UTC (3ª — urgência)
  cron.schedule('0 15 * * 3', () => runReminders(3), { timezone: 'UTC' })
  // Quinta 10h BRT = 13h UTC (4ª — última chamada, modo enche saco vai longe)
  cron.schedule('0 13 * * 4', () => runReminders(4), { timezone: 'UTC' })
  // Sexta  10h BRT = 13h UTC (5ª — só modo enche saco)
  cron.schedule('0 13 * * 5', () => runReminders(5), { timezone: 'UTC' })

  console.log('[Scheduler] ✅ Crons ativos:')
  console.log('  • A cada minuto   — processa fila (testes, confirmações)')
  console.log('  • Terça  08h BRT  — resumo semanal')
  console.log('  • Terça  10h/18h  — lembretes (1ª e 2ª tentativa)')
  console.log('  • Quarta 12h      — lembrete (3ª tentativa)')
  console.log('  • Quinta 10h      — lembrete (4ª — última chamada)')
  console.log('  • Sexta  10h      — lembrete (5ª — só modo enche saco)')
}
