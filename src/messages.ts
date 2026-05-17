import type { PendingAccount } from './firestore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Lembrete de drop ─────────────────────────────────────────────────────────

const REMINDERS_NORMAL = [
  (lines: string) =>
    `🎮 *LootFlow* — Lembrete\n\nAinda tem drop pra pegar essa semana:\n${lines}\n\n👉 https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — Ei!\n\nNão esquece dos drops:\n${lines}\n\nRegistra lá: https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — Drop disponível\n\n${lines}\n\nValor esperando por você 💰\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow*\n\nDrop dessa semana ainda não registrado:\n${lines}\n\nNão deixa o dinheiro escapar 👀\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
]

const REMINDERS_ENCHESACO = [
  (lines: string) =>
    `🔔 *LootFlow* — Oi!\n\nAinda tem drops sobrando:\n${lines}\n\n👉 https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `⚠️ *LootFlow* — Lembra não?\n\nEsses drops tão esperando:\n${lines}\n\nVai lá logo: https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🚨 *LootFlow* — Sério mesmo?\n\nAinda não registrou:\n${lines}\n\nO dinheiro tá ali, irmão 💸\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `😤 *LootFlow* — Vai logo porra\n\nDrop parado esperando:\n${lines}\n\nCara, registra logo isso:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `💀 *LootFlow* — irmão...\n\nEssa semana tá quase acabando e você:\n${lines}\n\nAinda tá perdendo dinheiro real todo dia que passa 🤦‍♂️\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — acorda\n\n${lines}\n\nEsse drop não vai se registrar sozinho né 😒\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
]

const REMINDERS_XINGAMENTOS = [
  (lines: string) =>
    `🤬 *LootFlow* — QUE PREGUIÇA MANO\n\n${lines}\n\nAbre o site AGORA e registra isso:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _pra eu parar de te encher o saco._`,
  (lines: string) =>
    `😡 *LootFlow* — para de ser vagabundo\n\nVocê deixou dinheiro na mesa de novo:\n${lines}\n\nVAI REGISTRAR: https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _pra me calar._`,
  (lines: string) =>
    `💢 *LootFlow* — tô de saco cheio\n\n${lines}\n\nFaz o favor de abrir o site e registrar isso antes que eu enlouqueça:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _se não aguenta mais._`,
  (lines: string) =>
    `🤦 *LootFlow* — PELO AMOR DE DEUS\n\n${lines}\n\nFicou rico já pra tá jogando dinheiro fora assim??\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _pra desativar._`,
  (lines: string) =>
    `😤 *LootFlow* — olha aqui\n\nQUANTAS VEZES PRECISO FALAR:\n${lines}\n\nABRE O SITE E REGISTRA:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _se tá com raiva de mim._`,
  (lines: string) =>
    `🔥 *LootFlow* — você me irrita\n\nEsse drop tá esperando desde não sei quando:\n${lines}\n\nPara de me fazer perder tempo e registra logo:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _pra eu me acalmar._`,
  (lines: string) =>
    `💀 *LootFlow* — vai se f*der\n\n${lines}\n\nMas antes de ir, registra o drop:\nhttps://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _pra desativar._`,
  (lines: string) =>
    `🤡 *LootFlow* — palhacinho\n\nDinheiro na conta: R$ 0,00\nDrop registrado: não\nMotivo: preguiça\n\n${lines}\n\nConserta isso: https://spxmiguel.github.io/LootFlow\n\n_Responda_ *PARAR* _se não aguenta._`,
]

export function buildReminderMessage(
  pending: PendingAccount[],
  attempt: number,
  encheSaco: boolean,
  xingamentos = false,
): string {
  const accountLines = pending
    .map(a => `• ${a.name} — ${a.dropsRegistered}/2 drops`)
    .join('\n')

  if (xingamentos) {
    const fn = pick(REMINDERS_XINGAMENTOS)
    return fn(accountLines)
  }

  if (encheSaco) {
    // Progressivo: nas primeiras tentativas mais suave, depois vai escalando
    const pool = attempt <= 2
      ? REMINDERS_ENCHESACO.slice(0, 3)
      : attempt <= 4
      ? REMINDERS_ENCHESACO.slice(2, 5)
      : REMINDERS_ENCHESACO.slice(4)
    const fn = pick(pool)
    return fn(accountLines)
  }

  const fn = pick(REMINDERS_NORMAL)
  return fn(accountLines)
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
      : '\n✅ Semana completa! Todos os drops registrados.\n'

  return (
    `🎮 *LootFlow* — Resumo da Semana\n\n` +
    `📊 Resultado:\n${accountLines}\n` +
    pendingWarning +
    `\n💰 Total: *R$ ${data.totalCashout.toFixed(2)}* em ${data.totalDrops} drop${data.totalDrops !== 1 ? 's' : ''}\n\n` +
    `👉 https://spxmiguel.github.io/LootFlow`
  )
}

// ─── Mensagem de teste ────────────────────────────────────────────────────────

export function buildTestMessage(): string {
  return (
    `🎮 *LootFlow Bot* — tô aqui!\n\n` +
    `✅ Conexão OK. Vou te lembrar dos drops CS2 toda semana.\n\n` +
    `Comandos disponíveis:\n` +
    `*STATUS* — ver drops da semana\n` +
    `*DROP [conta] [valor]* — registrar drop\n` +
    `*AJUDA* — ver todos os comandos\n\n` +
    `⚙️ Configurações em: LootFlow → Notificações WhatsApp\n\n` +
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
  const footer = allDone
    ? '\n\n🏆 Semana completa! Bom trabalho.'
    : '\n\n_Responda_ *AJUDA* _para ver comandos._'
  return `🎮 *LootFlow* — Drops desta semana\n\n${lines}${footer}`
}

export function buildDropRegisteredMessage(accountName: string, dropNumber: number, steamValue: number): string {
  const msgs = [
    `✅ *Drop registrado!*\n\n• Conta: *${accountName}*\n• Drop nº ${dropNumber}\n• Steam: R$ ${steamValue.toFixed(2)} · Estimativa: R$ ${(steamValue * 0.85).toFixed(2)}\n\n_Responda_ *STATUS* _para ver tudo._`,
    `💰 *Registrado!* ${accountName} · drop ${dropNumber}\n\nR$ ${steamValue.toFixed(2)} no bolso (estimativa R$ ${(steamValue * 0.85).toFixed(2)})\n\n_Responda_ *STATUS* _para o resumo._`,
    `✅ *${accountName}* — drop ${dropNumber} registrado!\n\nValor: R$ ${steamValue.toFixed(2)}\n\nBora fazer o próximo 💪\n\n_Responda_ *STATUS* _para ver todos._`,
  ]
  return pick(msgs)
}

export function buildHelpMessage(): string {
  return (
    `🎮 *LootFlow Bot* — Comandos\n\n` +
    `*STATUS* ou *DROPS* — drops desta semana\n` +
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
  const msgs = [
    `✅ *LootFlow* — Lembretes desativados.\n\nPaz e silêncio 🤫\nPara reativar: Configurações → Notificações WhatsApp`,
    `✅ *LootFlow* — Tá bom, vou parar.\n\nSe quiser reativar é só ir em: Configurações → Notificações WhatsApp`,
    `✅ *LootFlow* — Ok, sumiço.\n\nQuando precisar de mim de volta: Configurações → Notificações WhatsApp`,
  ]
  return pick(msgs)
}
