import type { PendingAccount } from './firestore'

// ─── Lembrete de drop ─────────────────────────────────────────────────────────

export function buildReminderMessage(
  pending: PendingAccount[],
  attempt: number,
  encheSaco: boolean,
): string {
  const accountLines = pending
    .map(a => `• ${a.name} — ${a.dropsRegistered}/2 drops`)
    .join('\n')

  if (encheSaco) {
    const urgencyEmoji = attempt === 1 ? '⚠️' : attempt === 2 ? '🔔' : attempt === 3 ? '🚨' : '💀'
    const urgencyText =
      attempt === 1
        ? 'Oi, lembrete amigável:'
        : attempt === 2
        ? 'Ei, ainda sem drop!'
        : attempt === 3
        ? 'CARA. REGISTRA O DROP.'
        : 'ÚLTIMA CHANCE. ABRE O SITE AGORA.'

    return (
      `${urgencyEmoji} *LootFlow* — ${urgencyText}\n\n` +
      `Contas pendentes:\n${accountLines}\n\n` +
      `👉 https://spxmiguel.github.io/LootFlow\n\n` +
      (attempt >= 3
        ? `_Você está perdendo dinheiro real por não registrar. Cada drop vale dinheiro! 💸_\n\n`
        : '') +
      `_Responda_ *PARAR* _para desativar._`
    )
  }

  const urgency =
    attempt === 1 ? '⚠️ Lembrete' : attempt === 2 ? '🔔 Segundo aviso' : '🚨 Última chamada'

  return (
    `🎮 *LootFlow* — ${urgency}\n\n` +
    `Drops pendentes essa semana:\n${accountLines}\n\n` +
    `Registre: https://spxmiguel.github.io/LootFlow\n\n` +
    `_Responda_ *PARAR* _para desativar._`
  )
}

// ─── Resumo semanal ───────────────────────────────────────────────────────────

export interface WeeklySummaryData {
  totalDrops: number
  totalCashout: number
  accountsSummary: Array<{ name: string; drops: number; cashout: number }>
  pending: PendingAccount[]
}

export function buildWeeklySummaryMessage(data: WeeklySummaryData): string {
  const accountLines = data.accountsSummary
    .map(a => `• ${a.name}: ${a.drops} drop${a.drops !== 1 ? 's' : ''} · R$ ${a.cashout.toFixed(2)}`)
    .join('\n')

  const pendingWarning =
    data.pending.length > 0
      ? `\n⚠️ *Ainda faltam drops:*\n${data.pending.map(p => `• ${p.name} — ${p.dropsRegistered}/2`).join('\n')}\n`
      : '\n✅ Todos os drops registrados essa semana!\n'

  return (
    `🎮 *LootFlow* — Resumo Semanal\n\n` +
    `📊 Esta semana:\n${accountLines}\n` +
    pendingWarning +
    `\n💰 Total: *R$ ${data.totalCashout.toFixed(2)}* (${data.totalDrops} drops)\n\n` +
    `👉 https://spxmiguel.github.io/LootFlow`
  )
}

// ─── Mensagem de teste ────────────────────────────────────────────────────────

export function buildTestMessage(): string {
  return (
    `🎮 *LootFlow Bot* — Teste de conexão\n\n` +
    `✅ Bot funcionando! Você vai receber lembretes automáticos quando tiver drops CS2 para pegar.\n\n` +
    `Configure os dias e horários em:\n` +
    `⚙️ Configurações → Notificações WhatsApp\n\n` +
    `_Responda_ *PARAR* _para desativar._`
  )
}

// ─── Status de drops ──────────────────────────────────────────────────────────

export function buildDropStatusMessage(accounts: Array<{ name: string; drops: number; cashout: number }>): string {
  if (accounts.length === 0) {
    return `🎮 *LootFlow* — Status\n\nNenhuma conta ativa cadastrada.\n\n👉 https://spxmiguel.github.io/LootFlow`
  }
  const lines = accounts.map(a => {
    const bar = a.drops >= 2 ? '✅' : a.drops === 1 ? '🟡' : '❌'
    return `${bar} ${a.name}: ${a.drops}/2 drops · R$ ${a.cashout.toFixed(2)}`
  }).join('\n')

  const allDone = accounts.every(a => a.drops >= 2)
  const footer = allDone ? '\n\n🏆 Semana completa!' : '\n\n_Responda_ *AJUDA* _para ver comandos._'
  return `🎮 *LootFlow* — Drops desta semana\n\n${lines}${footer}`
}

export function buildDropRegisteredMessage(accountName: string, dropNumber: number, steamValue: number): string {
  return (
    `✅ *Drop registrado!*\n\n` +
    `• Conta: *${accountName}*\n` +
    `• Drop nº ${dropNumber} desta semana\n` +
    `• Valor Steam: R$ ${steamValue.toFixed(2)}\n` +
    `• Estimativa cashout: R$ ${(steamValue * 0.85).toFixed(2)}\n\n` +
    `_Responda_ *STATUS* _para ver todos os drops._`
  )
}

export function buildHelpMessage(): string {
  return (
    `🎮 *LootFlow Bot* — Comandos\n\n` +
    `*STATUS* — ver drops desta semana\n` +
    `*DROP [conta] [valor]* — registrar drop\n` +
    `  Ex: _DROP AKM 15.50_\n` +
    `  Ex: _DROP servente 8.90_\n` +
    `*PARAR* — desativar lembretes\n\n` +
    `👉 https://spxmiguel.github.io/LootFlow`
  )
}

export function buildAccountNotFoundMessage(query: string, accounts: string[]): string {
  const list = accounts.map(a => `• ${a}`).join('\n')
  return (
    `❌ Conta "*${query}*" não encontrada.\n\n` +
    `Suas contas ativas:\n${list}\n\n` +
    `Use parte do nome. Ex: _DROP AKM 15.50_`
  )
}

// ─── Stop ─────────────────────────────────────────────────────────────────────

export function buildStopConfirmMessage(): string {
  return (
    `✅ *LootFlow* — Lembretes desativados.\n\n` +
    `Você não receberá mais avisos. Para reativar:\n` +
    `⚙️ Configurações → Notificações WhatsApp → Ativar lembretes`
  )
}
