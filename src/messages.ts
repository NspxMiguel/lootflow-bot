import type { PendingAccount } from './firestore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Lembrete de drop ─────────────────────────────────────────────────────────

const REMINDERS_NORMAL = [
  (lines: string) =>
    `🎮 *LootFlow* — Lembrete\n\nAinda tem drop pra pegar essa semana:\n${lines}\n\n👉 https://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — Ei!\n\nNão esquece dos drops:\n${lines}\n\nRegistra lá: https://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — Drop disponível\n\n${lines}\n\nValor esperando por você 💰\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow*\n\nDrop dessa semana ainda não registrado:\n${lines}\n\nNão deixa o dinheiro escapar 👀\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
]

const REMINDERS_ENCHESACO = [
  (lines: string) =>
    `🔔 *LootFlow* — Oi!\n\nAinda tem drops sobrando:\n${lines}\n\n👉 https://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `⚠️ *LootFlow* — Lembra não?\n\nEsses drops tão esperando:\n${lines}\n\nVai lá logo: https://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🚨 *LootFlow* — Sério mesmo?\n\nAinda não registrou:\n${lines}\n\nO dinheiro tá ali, irmão 💸\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `😤 *LootFlow* — Vai logo porra\n\nDrop parado esperando:\n${lines}\n\nCara, registra logo isso:\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `💀 *LootFlow* — irmão...\n\nEssa semana tá quase acabando e você:\n${lines}\n\nAinda tá perdendo dinheiro real todo dia que passa 🤦‍♂️\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
  (lines: string) =>
    `🎮 *LootFlow* — acorda\n\n${lines}\n\nEsse drop não vai se registrar sozinho né 😒\nhttps://www.nspx.dev/LootFlow\n\n_Responda_ *PARAR* _para desativar._`,
]

const LINK = 'https://www.nspx.dev/LootFlow'
const PARAR = `\n\n_Responda_ *PARAR* _pra me calar._`

const REMINDERS_XINGAMENTOS = [
  (lines: string, n: number) =>
    `🤬 *BORA SEU VAGABUNDO!*\n\nQUEM GANHA DINHEIRO NA CAMA É PUTA! FALTA FARMAR ${n} CONTA${n > 1 ? 'S' : ''} AINDA SEU MERDA, PARA DE SER LERDO E VAI LOGO:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `😡 *ACORDA PORRA!*\n\nOS DROPS TÃO ESPERANDO E VOCÊ AÍ PARADO. FALTA ${n} CONTA${n > 1 ? 'S' : ''} PRA FARMAR, MEXE ESSA BUNDA LOGO SEU PREGUIÇOSO:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🔥 *EI SEU FILHO DA PUTA!*\n\nOs drops tão te esperando em ${n} conta${n > 1 ? 's' : ''}. Tu vai deixar passar de novo?\n${lines}\n\nBORA CARALHO: ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `💢 *FALTA FARMAR ${n} CONTA${n > 1 ? 'S' : ''} SEU PREGUIÇOSO DE MERDA!*\n\n${lines}\n\nLEVANTA ESSA BUNDA E REGISTRA LOGO, SENÃO TU CHORA DEPOIS:\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `😤 *QUE É ISSO SEU MERDA!*\n\n${n} conta${n > 1 ? 's' : ''} esperando, PARA DE SER UM ESQUECIDO E VAI PEGAR AGORA:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🤦 *PORRA, TÁ DORMINDO NO PONTO?*\n\nVai pegar os drops das ${n} conta${n > 1 ? 's' : ''} seu animal, senão vai ficar só na vontade de novo:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `💀 *BORA SEU PUTO, PARA DE ENROLAÇÃO!*\n\nOs drops de ${n} conta${n > 1 ? 's' : ''} tão fresquinhos te esperando, não seja um inútil:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🚨 *ACORDA SEU FILHO DA PUTA!*\n\nJá tá na hora do drop semanal, ${n} conta${n > 1 ? 's' : ''} pra farmar, mexe essa bunda LOGO CARALHO:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `😡 *FALTANDO ${n} CONTA${n > 1 ? 'S' : ''} PRA FARMAR SEU LERDO DO CARALHO!*\n\nTu quer ficar sem? Então vai pegar agora seu vagabundo:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🤡 *RELATÓRIO DO INÚTIL DA SEMANA:*\n\nFarmou em todas as contas?: ❌\nContas faltando: ${n}\nMotivo: preguiça\nPrejuízo: dinheiro jogado fora\n\nConserta isso AGORA:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🔥 *VAI TOMAR NO CU SEU ESQUECIDO!*\n\nPega os drops das ${n} conta${n > 1 ? 's' : ''} antes que expire, porra:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `💢 *BORA PORRA!*\n\nOs drops de ${n} conta${n > 1 ? 's' : ''} não vão vir sozinhos. Tá esperando o quê, seu inútil? MEXE ESSA BUNDA AGORA:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `😤 *DROP SEMANAL SEU FILHO DA PUTA!*\n\nNão me faz te chamar de novo não, vai logo farmar essa${n > 1 ? 's' : ''} ${n} conta${n > 1 ? 's' : ''}:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string) =>
    `🤬 *ACORDA SEU PREGUIÇOSO DO CARALHO!*\n\nOs drops não caem do céu, levanta e registra:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `💀 *PARA DE SER UM FRACASSADO!*\n\n${n} conta${n > 1 ? 's' : ''} esperando, vai garantir seus drops agora:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string) =>
    `🚨 *PORRA, OS DROPS TÃO TE CHAMANDO!*\n\nNão seja um mané, vai farmar logo caralho:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `😡 *BORA SEU MOLEZA DE MERDA!*\n\n${n} conta${n > 1 ? 's' : ''} pra farmar essa semana. Vai ou vai continuar perdendo dinheiro?\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🤦 *EI SEU INÚTIL, PARA DE COISA!*\n\nVai pegar os drops das ${n} conta${n > 1 ? 's' : ''} senão tu vai se foder de novo essa semana:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `🔥 *OI SEU ANIMAL, TUDO BEM?*\n\n${n} conta${n > 1 ? 's' : ''} te esperando, mexe essa porra logo antes da semana acabar, vagabundo:\n${lines}\n\n👉 ${LINK}${PARAR}`,
  (lines: string, n: number) =>
    `💢 *ÚLTIMA CHAMADA SEU FILHO DA PUTA!*\n\nFarma essa${n > 1 ? 's' : ''} ${n} conta${n > 1 ? 's' : ''} agora ou continua sendo o rei dos esquecidos:\n${lines}\n\n👉 ${LINK}${PARAR}`,
]

const REMINDERS_NORMAL_EN = [
  (lines: string) =>
    `🎮 *LootFlow* — Reminder\n\nStill have drops to collect this week:\n${lines}\n\n👉 https://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
  (lines: string) =>
    `🎮 *LootFlow* — Hey!\n\nDon't forget your drops:\n${lines}\n\nLog them at: https://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
  (lines: string) =>
    `🎮 *LootFlow* — Drop available\n\n${lines}\n\nMoney waiting for you 💰\nhttps://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
]

const REMINDERS_ENCHESACO_EN = [
  (lines: string) =>
    `🔔 *LootFlow* — Hey!\n\nStill have pending drops:\n${lines}\n\n👉 https://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
  (lines: string) =>
    `⚠️ *LootFlow* — Still haven't done it?\n\nThese drops are waiting:\n${lines}\n\nGo log them: https://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
  (lines: string) =>
    `😤 *LootFlow* — Seriously?\n\nYou still haven't registered:\n${lines}\n\nThe money is RIGHT THERE 💸\nhttps://www.nspx.dev/LootFlow\n\n_Reply_ *STOP* _to disable._`,
]

export function buildReminderMessage(
  pending: PendingAccount[],
  attempt: number,
  encheSaco: boolean,
  xingamentos = false,
  enabledXingamentos?: number[],
  lang: 'pt' | 'en' = 'pt',
): string {
  const accountLines = pending
    .map(a => `• ${a.name} — ${a.dropsRegistered}/2 drops`)
    .join('\n')

  // EN users: skip xingamentos (inherently PT), use EN reminder pools
  if (lang === 'en') {
    if (encheSaco) {
      const fn = pick(REMINDERS_ENCHESACO_EN)
      return fn(accountLines)
    }
    const fn = pick(REMINDERS_NORMAL_EN)
    return fn(accountLines)
  }

  if (xingamentos) {
    const pool = enabledXingamentos != null
      ? REMINDERS_XINGAMENTOS.filter((_, i) => enabledXingamentos.includes(i))
      : REMINDERS_XINGAMENTOS
    // fallback to encheSaco if all disabled
    if (pool.length > 0) {
      const fn = pick(pool)
      return fn(accountLines, pending.length)
    }
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
    `👉 https://www.nspx.dev/LootFlow`
  )
}

// ─── Elogio com xingamento (semana completa, modo xingamentos ativo) ──────────

export function buildAllDoneXingamentoMessage(totalCashout: number): string {
  const msgs = [
    `✅ *FINALMENTE SEU VAGABUNDO!*\n\nFarmou tudo essa semana. Tá de parabéns, seu preguiçoso. Só demorou né?\n\n💰 Cashout da semana: *R$ ${totalCashout.toFixed(2)}*\n\nAgora descansa que semana que vem eu tô aqui de novo pra te encher o saco 😘`,
    `🏆 *OLHA SÓ, FARMOU TUDO!*\n\nNem acreditei. Achei que ia ter que te xingar até amanhã.\n\n💰 Ganhaste: *R$ ${totalCashout.toFixed(2)}*\n\nBom trabalho, seu lerdo. Semana que vem não esquece de novo não, tá?`,
    `🎉 *EBA, SEU INÚTIL VIROU ÚTIL!*\n\nTodas as contas farmadas. Isso aí meu filho.\n\n💰 *R$ ${totalCashout.toFixed(2)}* no bolso\n\nQuem diria que você conseguia né? Semana que vem repete isso 👏`,
    `💰 *MISSÃO CUMPRIDA, SEU MANÉ!*\n\nFez o que tinha que fazer. Demorou, mas foi.\n\n*R$ ${totalCashout.toFixed(2)}* garantido essa semana.\n\nSe não fosse eu aqui te enchendo o saco você ia perder tudo isso, tá ligado? De nada 😂`,
    `✅ *RAPAZ, FARMOU TUDO!*\n\nTô orgulhoso. Com raiva, mas orgulhoso.\n\n💰 *R$ ${totalCashout.toFixed(2)}* — não é muito não mas é seu\n\nDescansa aí vagabundo, você merece. Até semana que vem 👊`,
    `🤩 *RELATÓRIO DO INÚTIL DA SEMANA:*\n\nFarmou em todas as contas?: ✅\nContas faltando: 0\nMotivo do sucesso: eu ficando no seu ouvido\nGanhou: *R$ ${totalCashout.toFixed(2)}*\n\nDe nada. Semana que vem tô aqui de novo 😇`,
  ]
  return pick(msgs)
}

// ─── Mensagem de teste ────────────────────────────────────────────────────────

export function buildTestMessage(lang: 'pt' | 'en' = 'pt'): string {
  if (lang === 'en') {
    return (
      `🎮 *LootFlow Bot* — I'm here!\n\n` +
      `✅ Connection OK. I'll remind you about CS2 drops every week.\n\n` +
      `Available commands:\n` +
      `*STATUS* — see this week's drops\n` +
      `*HELP* — see all commands\n\n` +
      `⚙️ Settings at: LootFlow → WhatsApp Notifications\n\n` +
      `_Reply_ *STOP* _to disable._`
    )
  }
  return (
    `🎮 *LootFlow Bot* — tô aqui!\n\n` +
    `✅ Conexão OK. Vou te lembrar dos drops CS2 toda semana.\n\n` +
    `Comandos disponíveis:\n` +
    `*STATUS* — ver drops da semana\n` +
    `*AJUDA* — ver todos os comandos\n\n` +
    `⚙️ Configurações em: LootFlow → Notificações WhatsApp\n\n` +
    `_Responda_ *PARAR* _para desativar._`
  )
}

// ─── Status de drops ──────────────────────────────────────────────────────────

export function buildDropStatusMessage(accounts: Array<{ name: string; drops: number; cashout: number }>): string {
  if (accounts.length === 0) {
    return `🎮 *LootFlow* — Status\n\nNenhuma conta ativa cadastrada.\n\n👉 https://www.nspx.dev/LootFlow`
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


// ─── Boas-vindas modo xingamentos ────────────────────────────────────────────

export function buildXingamentosWelcomeMessage(): string {
  return (
    `🤬 *ATENÇÃO SEU MERDA!*\n\n` +
    `Eae, só passando pra te avisar que o *Modo Xingamentos* tá ATIVADO, caralho.\n\n` +
    `A partir de agora, toda vez que você for um vagabundo e esquecer de farmar, ` +
    `eu vou aparecer aqui pra te encher o saco com palavrão e tudo.\n\n` +
    `Quer desativar? Vai lá nas configurações, filho da puta. ` +
    `Mas depois não adianta chorar que o bot ficou grosseiro — ` +
    `*você mesmo ativou essa merda.*\n\n` +
    `Agora vai farmar seu lerdo, e não me faça ter que te xingar hoje não.\n\n` +
    `— _LootFlow Bot, com muito amor_ 💀`
  )
}

const COMMANDS_LIST_PT =
  `*STATUS* ou *DROPS* — drops desta semana\n` +
  `*/HELP* ou *AJUDA* — esta lista\n` +
  `*PARAR* — desativar lembretes`

const COMMANDS_LIST_EN =
  `*STATUS* or *DROPS* — this week's drops\n` +
  `*/HELP* or *AJUDA* — this list\n` +
  `*STOP* or *PARAR* — disable reminders`

export function buildHelpMessage(lang: 'pt' | 'en' = 'pt'): string {
  if (lang === 'en') {
    return (
      `🎮 *LootFlow Bot* — Commands\n\n` +
      COMMANDS_LIST_EN +
      `\n\n👉 https://www.nspx.dev/LootFlow`
    )
  }
  return (
    `🎮 *LootFlow Bot* — Comandos\n\n` +
    COMMANDS_LIST_PT +
    `\n\n👉 https://www.nspx.dev/LootFlow`
  )
}

export function buildUnknownCommandMessage(original: string, lang: 'pt' | 'en' = 'pt'): string {
  const safe = original.length > 40 ? original.slice(0, 40) + '…' : original
  if (lang === 'en') {
    return (
      `❓ I didn't recognize the command *"${safe}"*.\n\n` +
      `Available commands:\n` +
      COMMANDS_LIST_EN +
      `\n\n👉 https://www.nspx.dev/LootFlow`
    )
  }
  return (
    `❓ Não reconheci o comando *"${safe}"*.\n\n` +
    `Comandos disponíveis:\n` +
    COMMANDS_LIST_PT +
    `\n\n👉 https://www.nspx.dev/LootFlow`
  )
}

// ─── Stop ─────────────────────────────────────────────────────────────────────

export function buildStopConfirmMessage(lang: 'pt' | 'en' = 'pt'): string {
  if (lang === 'en') {
    const msgs = [
      `✅ *LootFlow* — Reminders disabled.\n\nPeace and quiet 🤫\nTo re-enable: Settings → WhatsApp Notifications`,
      `✅ *LootFlow* — Got it, going silent.\n\nTo bring me back: Settings → WhatsApp Notifications`,
    ]
    return pick(msgs)
  }
  const msgs = [
    `✅ *LootFlow* — Lembretes desativados.\n\nPaz e silêncio 🤫\nPara reativar: Configurações → Notificações WhatsApp`,
    `✅ *LootFlow* — Tá bom, vou parar.\n\nSe quiser reativar é só ir em: Configurações → Notificações WhatsApp`,
    `✅ *LootFlow* — Ok, sumiço.\n\nQuando precisar de mim de volta: Configurações → Notificações WhatsApp`,
  ]
  return pick(msgs)
}
