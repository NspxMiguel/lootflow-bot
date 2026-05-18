/**
 * Lógica de semana CS2 — espelha exatamente o frontend (src/lib/utils.ts).
 * CS2 reseta drops toda terça-feira.
 */

import type { WhatsAppSettings } from './firestore'

export function getWeekIdForDate(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon, 2=Tue, ...
  // Dias para voltar até a terça-feira mais recente
  const daysBack = day === 0 ? 5 : (day - 2 + 7) % 7
  d.setDate(d.getDate() - daysBack)
  d.setHours(0, 0, 0, 0)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function getCurrentWeekId(): string {
  return getWeekIdForDate(new Date())
}

/**
 * Verifica se o horário atual (em BRT = UTC-3) está dentro da janela de silêncio.
 * quietStart e quietEnd são strings "HH:MM".
 * Suporta janelas que cruzam a meia-noite (ex: 22:00 → 08:00).
 */
export function isInQuietHours(
  quietStart: string,
  quietEnd: string,
  tzOffset: number = -3,
): boolean {
  const now = new Date()
  const localMs = now.getTime() + tzOffset * 60 * 60 * 1000
  const local = new Date(localMs)
  const h = local.getUTCHours()
  const m = local.getUTCMinutes()
  const nowMin = h * 60 + m

  const [sh, sm] = quietStart.split(':').map(Number)
  const [eh, em] = quietEnd.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em

  if (startMin <= endMin) {
    return nowMin >= startMin && nowMin < endMin
  } else {
    return nowMin >= startMin || nowMin < endMin
  }
}

/**
 * Verifica se o bot deve enviar mensagem agora para este usuário.
 * Suporta o novo sistema de schedule por dia E o legado (remindDays + quietHours).
 */
export function isActiveForSchedule(
  whatsapp: WhatsAppSettings,
  now: Date = new Date(),
  tzOffset: number = -3,
): boolean {
  // Converte para horário local (BRT) antes de checar o dia da semana
  const localMs = now.getTime() + tzOffset * 3600000
  const local = new Date(localMs)
  const day = local.getUTCDay()
  const h = local.getUTCHours()
  const m = local.getUTCMinutes()
  const nowMin = h * 60 + m

  // ── Novo sistema: schedule por dia ───────────────────────────────────────
  if (whatsapp.schedule && Object.keys(whatsapp.schedule).length > 0) {
    const dayConf = whatsapp.schedule[day]
    if (!dayConf?.enabled) return false

    const [sh, sm] = dayConf.activeStart.split(':').map(Number)
    const [eh, em] = dayConf.activeEnd.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em

    if (startMin <= endMin) {
      return nowMin >= startMin && nowMin < endMin
    }
    return nowMin >= startMin || nowMin < endMin
  }

  // ── Legacy: remindDays + quietHours ──────────────────────────────────────
  const remindDays = whatsapp.remindDays ?? [2, 3, 4]
  if (!remindDays.includes(day)) return false
  return !isInQuietHours(
    whatsapp.quietStart ?? '22:00',
    whatsapp.quietEnd ?? '08:00',
    tzOffset,
  )
}
