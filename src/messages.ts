import type { PendingAccount } from './firestore'

export function buildReminderMessage(pending: PendingAccount[], attempt: number): string {
  const urgency =
    attempt === 1
      ? '⚠️ Lembrete'
      : attempt === 2
      ? '🔔 Segundo aviso'
      : '🚨 Última chamada'

  const accountLines = pending
    .map(a => `• ${a.name} — ${a.dropsRegistered}/2 drops`)
    .join('\n')

  return (
    `🎮 *LootFlow* — ${urgency}\n\n` +
    `Você ainda tem drops CS2 para pegar essa semana:\n` +
    `${accountLines}\n\n` +
    `Acesse agora e registre antes de perder:\n` +
    `https://spxmiguel.github.io/LootFlow\n\n` +
    `_Responda_ *PARAR* _para desativar os lembretes._`
  )
}

export function buildStopConfirmMessage(): string {
  return (
    '✅ *LootFlow* — Lembretes desativados.\n\n' +
    'Você não receberá mais avisos de drop. ' +
    'Para reativar, acesse Configurações > Notificações WhatsApp no app.'
  )
}
