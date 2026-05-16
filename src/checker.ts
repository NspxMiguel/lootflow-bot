/**
 * Lógica de semana CS2 — espelha exatamente o frontend (src/lib/utils.ts).
 * CS2 reseta drops toda terça-feira.
 */

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
    // Janela dentro do mesmo dia: ex 09:00 → 18:00
    return nowMin >= startMin && nowMin < endMin
  } else {
    // Janela cruzando meia-noite: ex 22:00 → 08:00
    return nowMin >= startMin || nowMin < endMin
  }
}
