import cron from 'node-cron'
import {
  getAllUsersWithWA, getPendingAccounts, getWeeklySummary, drainNotificationQueue,
  getUserWASettings, saveLastReminderAt,
} from './firestore'
import { getCurrentWeekId, isActiveForSchedule } from './checker'
import {
  buildReminderMessage, buildWeeklySummaryMessage, buildTestMessage, buildAllDoneXingamentoMessage, buildXingamentosWelcomeMessage,
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
      if (['test','force_reminder','xingamentos_welcome','send_verify_code'].includes(item.type)) {
        const wa = await getUserWASettings(item.uid)
        if (!wa) {
          console.warn(`[Queue] ⚠️ ${item.type} ignorado — uid ${item.uid} sem número`)
          continue
        }
        if (item.type === 'send_verify_code') {
          if (!wa.verifyCode) { console.warn(`[Queue] ⚠️ send_verify_code sem código para uid ${item.uid}`); continue }
          await sendMessage(wa.phone, `🎮 *LootFlow* — Verificação de número\n\nSeu código de verificação:\n\n*${wa.verifyCode}*\n\nDigite esse código no LootFlow → Configurações → Notificações WhatsApp.\n\n_O código expira quando você verificar._`)
          console.log(`[Queue] ✅ Código de verificação enviado para uid ${item.uid} (${wa.phone})`)
        } else if (item.type === 'xingamentos_welcome') {
          await sendMessage(wa.phone, buildXingamentosWelcomeMessage())
          console.log(`[Queue] 🤬 Boas-vindas xingamentos para uid ${item.uid} (${wa.phone})`)
        } else if (item.type === 'test') {
          await sendMessage(wa.phone, buildTestMessage())
          console.log(`[Queue] ✅ Teste enviado para uid ${item.uid} (${wa.phone})`)
        } else {
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
        const users = await getAllUsersWithWA()
        const userConfig = users.find(u => u.uid === item.uid)
        if (!userConfig) continue

        const { phone } = userConfig.whatsapp

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
      }
    } catch (e) {
      console.error(`[Queue] ❌ Erro ao processar notificação ${item.docId}:`, e)
    }
  }
}

// ─── Lembretes periódicos (roda a cada 30 min) ────────────────────────────────

async function runReminders(): Promise<void> {
  if (!isClientReady()) return

  const now = new Date()
  const weekId = getCurrentWeekId()
  const users = await getAllUsersWithWA()

  for (const { uid, whatsapp } of users) {
    try {
      // Dia e horário — usa schedule por dia (ou legacy remindDays+quietHours)
      if (!isActiveForSchedule(whatsapp, now, config.tzOffset)) continue

      // Drops pendentes?
      const pending = await getPendingAccounts(uid, weekId)

      // Se tudo farmado e modo xingamentos ativo, manda elogio (só uma vez por dia)
      if (pending.length === 0) {
        if (whatsapp.xingamentos) {
          const lastAt = whatsapp.lastReminderAt ? new Date(whatsapp.lastReminderAt) : null
          const today = now.toDateString()
          if (!lastAt || lastAt.toDateString() !== today) {
            const summary = await getWeeklySummary(uid, weekId)
            await sendMessage(whatsapp.phone, buildAllDoneXingamentoMessage(summary.totalCashout))
            await saveLastReminderAt(uid)
            console.log(`[Scheduler] 🎉 Elogio xingamento para uid ${uid}`)
          }
        }
        continue
      }

      if (whatsapp.encheSaco) {
        // Modo enche o saco: respeita o intervalo configurado
        const intervalMs = (whatsapp.encheSacoInterval ?? 60) * 60 * 1000
        const lastAt = whatsapp.lastReminderAt ? new Date(whatsapp.lastReminderAt).getTime() : 0
        const elapsed = now.getTime() - lastAt

        if (elapsed < intervalMs) {
          const remaining = Math.ceil((intervalMs - elapsed) / 60000)
          console.log(`[Scheduler] ⏱ uid ${uid} — próximo em ${remaining} min`)
          continue
        }

        // Calcula tentativa com base no número de intervalos passados desde o início do dia
        const startOfDay = new Date(now)
        startOfDay.setHours(0, 0, 0, 0)
        const msSinceDay = now.getTime() - startOfDay.getTime()
        const attempt = Math.floor(msSinceDay / intervalMs) + 1

        const msg = buildReminderMessage(pending, attempt, true, whatsapp.xingamentos ?? false)
        await sendMessage(whatsapp.phone, msg)
        await saveLastReminderAt(uid)
        console.log(`[Scheduler] 🔔 Enche saco tentativa ${attempt} para uid ${uid}`)

      } else {
        // Modo normal: envia só uma vez por dia (se ainda não enviou hoje)
        const lastAt = whatsapp.lastReminderAt ? new Date(whatsapp.lastReminderAt) : null
        const today = now.toDateString()
        if (lastAt && lastAt.toDateString() === today) {
          console.log(`[Scheduler] ⏭ uid ${uid} — já enviado hoje (modo normal)`)
          continue
        }

        const msg = buildReminderMessage(pending, 1, false, whatsapp.xingamentos ?? false)
        await sendMessage(whatsapp.phone, msg)
        await saveLastReminderAt(uid)
        console.log(`[Scheduler] ✅ Lembrete para uid ${uid}`)
      }

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
  // Fila de notificações: a cada minuto
  cron.schedule('* * * * *', () => processQueue(), { timezone: 'UTC' })

  // Lembretes: a cada 30 min (lógica interna controla intervalo por usuário)
  cron.schedule('*/30 * * * *', () => runReminders(), { timezone: 'UTC' })

  // Resumo semanal: terça 08h BRT = 11h UTC
  cron.schedule('0 11 * * 2', () => runWeeklySummaries(), { timezone: 'UTC' })

  console.log('[Scheduler] ✅ Crons ativos:')
  console.log('  • A cada minuto    — fila (testes, drops registrados)')
  console.log('  • A cada 30 min    — lembretes (intervalo por usuário)')
  console.log('  • Terça 08h BRT    — resumo semanal')
}
