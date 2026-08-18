# Pedidos — lootflow-bot

## Em aberto

_(nenhum)_

## Entregues

- **18/08/2026 — Corrigir 17 vulnerabilidades apontadas pelo scanner de pacotes (SCA) no `lootflow-bot`.**
  Ele colou a tela do scanner: 1 crítico, 8 altos, 7 médios, 1 baixo. Pacotes
  citados: `websocket-driver` (crítico + médio), `@grpc/grpc-js` (2), `protobufjs` (3),
  `brace-expansion` (2), `form-data`, `js-yaml` (2), `ws`, `uuid` (3), `body-parser`.
  → Entregue: firebase-admin 14, node-cron 4, puppeteer 25 (override), Node 22 na
  imagem; `npm audit` = 0.
