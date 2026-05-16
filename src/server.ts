import express from 'express'
import QRCode from 'qrcode'

const app = express()
let currentQR: string | null = null
let botStatus: 'waiting_qr' | 'connected' | 'disconnected' = 'waiting_qr'

export function setCurrentQR(qr: string) {
  currentQR = qr
  botStatus = 'waiting_qr'
}

export function setBotConnected() {
  currentQR = null
  botStatus = 'connected'
}

export function setBotDisconnected() {
  botStatus = 'disconnected'
}

// ── /health — Railway usa pra saber se tá vivo
app.get('/health', (_req, res) => {
  res.json({ status: botStatus, ts: new Date().toISOString() })
})

// ── /qr — página HTML com o QR code pra escanear
app.get('/qr', async (_req, res) => {
  if (botStatus === 'connected') {
    return res.send(`
      <html><body style="background:#0d1117;color:#4ade80;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
        <div style="font-size:48px">✅</div>
        <div style="font-size:20px;font-weight:bold">WhatsApp Conectado!</div>
        <div style="color:#64748b;font-size:13px">O bot está funcionando normalmente.</div>
      </body></html>
    `)
  }

  if (!currentQR) {
    return res.send(`
      <html><head><meta http-equiv="refresh" content="3"></head>
      <body style="background:#0d1117;color:#94a3b8;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px">
        <div style="font-size:32px">⏳</div>
        <div>Aguardando QR code... (atualiza automaticamente)</div>
      </body></html>
    `)
  }

  try {
    const qrDataURL = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 })
    res.send(`
      <html><head><meta http-equiv="refresh" content="30"></head>
      <body style="background:#0d1117;color:#f8fafc;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:20px;text-align:center">
        <div style="font-size:22px;font-weight:bold">🎮 LootFlow Bot</div>
        <div style="color:#94a3b8;font-size:13px">Escaneie com o WhatsApp do número dedicado</div>
        <img src="${qrDataURL}" style="border-radius:12px;border:2px solid #1e293b" />
        <div style="color:#64748b;font-size:11px">Atualiza automaticamente a cada 30s · Válido por ~60s</div>
      </body></html>
    `)
  } catch {
    res.status(500).send('Erro ao gerar QR')
  }
})

export function startServer(port = 3000) {
  app.listen(port, () => {
    console.log(`[Server] ✅ HTTP em http://localhost:${port}`)
    console.log(`[Server] 📱 QR code em http://localhost:${port}/qr`)
  })
}
