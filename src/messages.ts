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

const LINK = 'https://spxmiguel.github.io/LootFlow'
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
    return fn(accountLines, pending.length)
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

const COMMANDS_LIST =
  `*STATUS* ou *DROPS* — drops desta semana\n` +
  `*DROP [conta] [item]* — registrar drop (busca preço automático)\n` +
  `  Ex: _DROP AKM Operation Bravo Case_\n` +
  `*DROP [conta] [valor]* — registrar drop com valor manual\n` +
  `  Ex: _DROP AKM 15.50_\n` +
  `*/HELP* ou *AJUDA* — esta lista\n` +
  `*PARAR* — desativar lembretes`

export function buildHelpMessage(): string {
  return (
    `🎮 *LootFlow Bot* — Comandos\n\n` +
    COMMANDS_LIST +
    `\n\n👉 https://spxmiguel.github.io/LootFlow`
  )
}

export function buildUnknownCommandMessage(original: string): string {
  // trim to 40 chars to avoid huge echo
  const safe = original.length > 40 ? original.slice(0, 40) + '…' : original
  return (
    `❓ Não reconheci o comando *"${safe}"*.\n\n` +
    `Comandos disponíveis:\n` +
    COMMANDS_LIST +
    `\n\n👉 https://spxmiguel.github.io/LootFlow`
  )
}

export function buildDropConfirmMessage(
  accountName: string,
  itemName: string,
  price: number,
): string {
  return (
    `🔍 *Confirmar drop?*\n\n` +
    `• Conta: *${accountName}*\n` +
    `• Item: ${itemName}\n` +
    `• Preço Steam: *R$ ${price.toFixed(2)}*\n` +
    `• Estimativa cashout: R$ ${(price * 0.85).toFixed(2)}\n\n` +
    `Responda *SIM* para registrar ou *NÃO* para cancelar.`
  )
}

export function buildDropCancelledMessage(): string {
  return `❌ *Drop cancelado.* Nada foi registrado.`
}

export function buildSteamNotFoundMessage(query: string): string {
  return (
    `❌ Não encontrei o item *"${query}"* no Steam Market.\n\n` +
    `Tente usar o nome exato, ou informe o valor manualmente:\n` +
    `  Ex: _DROP AKM 15.50_`
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
